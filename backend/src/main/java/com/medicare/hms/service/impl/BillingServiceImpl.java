package com.medicare.hms.service.impl;

import com.medicare.hms.dto.request.BillGenerateRequest;
import com.medicare.hms.dto.request.BillItemRequest;
import com.medicare.hms.dto.request.PaymentRecordRequest;
import com.medicare.hms.dto.response.BillResponse;
import com.medicare.hms.dto.response.PagedResponse;
import com.medicare.hms.dto.response.PaymentResponse;
import com.medicare.hms.entity.*;
import com.medicare.hms.exception.BadRequestException;
import com.medicare.hms.exception.ResourceNotFoundException;
import com.medicare.hms.mapper.EntityDtoMapper;
import com.medicare.hms.repository.*;
import com.medicare.hms.security.UserPrincipal;
import com.medicare.hms.service.AuditLogService;
import com.medicare.hms.service.BillingService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BillingServiceImpl implements BillingService {

    private final BillRepository billRepository;
    private final BillItemRepository billItemRepository;
    private final PaymentRepository paymentRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final EntityDtoMapper mapper;
    private final AuditLogService auditLogService;

    public BillingServiceImpl(BillRepository billRepository,
                              BillItemRepository billItemRepository,
                              PaymentRepository paymentRepository,
                              PatientRepository patientRepository,
                              AppointmentRepository appointmentRepository,
                              UserRepository userRepository,
                              EntityDtoMapper mapper,
                              AuditLogService auditLogService) {
        this.billRepository = billRepository;
        this.billItemRepository = billItemRepository;
        this.paymentRepository = paymentRepository;
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.mapper = mapper;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public BillResponse generateBill(BillGenerateRequest request, UserPrincipal currentUser) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + request.getPatientId()));

        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId()).orElse(null);
        }

        BigDecimal consultation = request.getConsultationCharge() != null ? request.getConsultationCharge() : BigDecimal.ZERO;
        BigDecimal additional = BigDecimal.ZERO;

        Bill bill = new Bill();
        bill.setBillNumber(generateBillNumber());
        bill.setPatient(patient);
        bill.setAppointment(appointment);
        bill.setConsultationCharge(consultation.setScale(2, RoundingMode.HALF_UP));

        if (request.getItems() != null) {
            for (BillItemRequest itemReq : request.getItems()) {
                BigDecimal itemTotal = itemReq.getUnitPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity())).setScale(2, RoundingMode.HALF_UP);
                additional = additional.add(itemTotal);

                BillItem item = new BillItem();
                item.setItemDescription(itemReq.getItemDescription().trim());
                item.setQuantity(itemReq.getQuantity());
                item.setUnitPrice(itemReq.getUnitPrice().setScale(2, RoundingMode.HALF_UP));
                item.setTotalPrice(itemTotal);
                bill.addItem(item);
            }
        }

        bill.setAdditionalCharges(additional.setScale(2, RoundingMode.HALF_UP));

        BigDecimal discount = request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO;
        bill.setDiscount(discount.setScale(2, RoundingMode.HALF_UP));

        BigDecimal subtotal = consultation.add(additional).subtract(discount);
        if (subtotal.compareTo(BigDecimal.ZERO) < 0) {
            subtotal = BigDecimal.ZERO;
        }

        BigDecimal taxRate = request.getTaxRate() != null ? request.getTaxRate() : BigDecimal.ZERO;
        bill.setTaxRate(taxRate.setScale(2, RoundingMode.HALF_UP));

        BigDecimal taxAmount = subtotal.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        bill.setTaxAmount(taxAmount);

        BigDecimal totalAmount = subtotal.add(taxAmount).setScale(2, RoundingMode.HALF_UP);
        bill.setTotalAmount(totalAmount);
        bill.setPaidAmount(BigDecimal.ZERO);
        bill.setBalanceDue(totalAmount);
        bill.setPaymentStatus(totalAmount.compareTo(BigDecimal.ZERO) == 0 ? BillPaymentStatus.PAID : BillPaymentStatus.UNPAID);
        bill.setDueDate(request.getDueDate() != null ? request.getDueDate() : LocalDate.now().plusDays(15));
        bill.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);

        Bill saved = billRepository.save(bill);

        String performedBy = currentUser != null ? currentUser.getUsername() : "SYSTEM";
        auditLogService.logAction("BILL_GENERATED", "Bill", saved.getId(), performedBy,
                "Generated invoice " + saved.getBillNumber() + " of amount " + saved.getTotalAmount() + " for patient " + patient.getFullName());

        return mapper.toBillResponse(saved);
    }

    @Override
    @Transactional
    public PaymentResponse recordPayment(Long billId, PaymentRecordRequest request, UserPrincipal currentUser) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));

        if (bill.getPaymentStatus() == BillPaymentStatus.PAID) {
            throw new BadRequestException("This invoice has already been settled in full.");
        }
        if (bill.getPaymentStatus() == BillPaymentStatus.VOID) {
            throw new BadRequestException("Cannot accept payments on a voided invoice.");
        }

        BigDecimal paymentAmount = request.getAmount().setScale(2, RoundingMode.HALF_UP);
        if (paymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Payment amount must be greater than zero.");
        }

        if (paymentAmount.compareTo(bill.getBalanceDue()) > 0) {
            throw new BadRequestException(String.format("Payment amount (%.2f) exceeds outstanding balance (%.2f).",
                    paymentAmount, bill.getBalanceDue()));
        }

        User recorder = null;
        if (currentUser != null) {
            recorder = userRepository.findById(currentUser.getId()).orElse(null);
        }

        Payment payment = new Payment();
        payment.setPaymentReference(generatePaymentReference());
        payment.setBill(bill);
        payment.setAmount(paymentAmount);
        payment.setPaymentMethod(request.getPaymentMethod().trim().toUpperCase());
        payment.setTransactionReference(request.getTransactionReference() != null ? request.getTransactionReference().trim() : null);
        payment.setPaymentTimestamp(LocalDateTime.now());
        payment.setRecordedBy(recorder);
        payment.setStatus("SUCCESS");
        payment.setNotes(request.getNotes() != null ? request.getNotes().trim() : "Demo Manual Payment Entry");

        Payment savedPayment = paymentRepository.save(payment);

        // Update Bill balances
        BigDecimal newPaidAmount = bill.getPaidAmount().add(paymentAmount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal newBalanceDue = bill.getTotalAmount().subtract(newPaidAmount).setScale(2, RoundingMode.HALF_UP);
        bill.setPaidAmount(newPaidAmount);
        bill.setBalanceDue(newBalanceDue);

        if (newBalanceDue.compareTo(BigDecimal.ZERO) <= 0) {
            bill.setPaymentStatus(BillPaymentStatus.PAID);
        } else {
            bill.setPaymentStatus(BillPaymentStatus.PARTIALLY_PAID);
        }

        billRepository.save(bill);

        String performedBy = currentUser != null ? currentUser.getUsername() : "SYSTEM";
        auditLogService.logAction("PAYMENT_RECORDED", "Payment", savedPayment.getId(), performedBy,
                "Recorded payment " + savedPayment.getPaymentReference() + " of " + paymentAmount + " for " + bill.getBillNumber());

        return mapper.toPaymentResponse(savedPayment);
    }

    @Override
    @Transactional(readOnly = true)
    public BillResponse getBillById(Long id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + id));
        return mapper.toBillResponse(bill);
    }

    @Override
    @Transactional(readOnly = true)
    public BillResponse getBillByBillNumber(String billNumber) {
        Bill bill = billRepository.findByBillNumber(billNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with number: " + billNumber));
        return mapper.toBillResponse(bill);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<BillResponse> getBills(Long patientId, BillPaymentStatus status, LocalDateTime startDate,
                                                LocalDateTime endDate, String search, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        Page<Bill> page = billRepository.findWithFilters(patientId, status, startDate, endDate, cleanSearch, pageable);

        List<BillResponse> list = page.getContent().stream()
                .map(mapper::toBillResponse)
                .collect(Collectors.toList());

        return new PagedResponse<>(
                list,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getBillPayments(Long billId) {
        billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));

        return paymentRepository.findByBillIdOrderByPaymentTimestampDesc(billId).stream()
                .map(mapper::toPaymentResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<PaymentResponse> getAllPayments(Long billId, String paymentMethod, LocalDateTime startDate,
                                                         LocalDateTime endDate, Pageable pageable) {
        Page<Payment> page = paymentRepository.findWithFilters(billId, paymentMethod, startDate, endDate, pageable);

        List<PaymentResponse> list = page.getContent().stream()
                .map(mapper::toPaymentResponse)
                .collect(Collectors.toList());

        return new PagedResponse<>(
                list,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    private synchronized String generateBillNumber() {
        int year = LocalDate.now().getYear();
        long count = billRepository.count() + 1;
        String candidate = String.format("INV-%d-%04d", year, count);
        int offset = 1;
        while (billRepository.existsByBillNumber(candidate)) {
            candidate = String.format("INV-%d-%04d", year, count + offset);
            offset++;
        }
        return candidate;
    }

    private synchronized String generatePaymentReference() {
        int year = LocalDate.now().getYear();
        long count = paymentRepository.count() + 1;
        String candidate = String.format("PAY-%d-%04d", year, count);
        int offset = 1;
        while (paymentRepository.existsByPaymentReference(candidate)) {
            candidate = String.format("PAY-%d-%04d", year, count + offset);
            offset++;
        }
        return candidate;
    }
}
