package com.medicare.hms.service;

import com.medicare.hms.dto.request.BillGenerateRequest;
import com.medicare.hms.dto.request.BillItemRequest;
import com.medicare.hms.dto.request.PaymentRecordRequest;
import com.medicare.hms.dto.response.BillResponse;
import com.medicare.hms.dto.response.PaymentResponse;
import com.medicare.hms.entity.Bill;
import com.medicare.hms.entity.BillPaymentStatus;
import com.medicare.hms.entity.Patient;
import com.medicare.hms.entity.Payment;
import com.medicare.hms.entity.Role;
import com.medicare.hms.exception.BadRequestException;
import com.medicare.hms.mapper.EntityDtoMapper;
import com.medicare.hms.repository.*;
import com.medicare.hms.security.UserPrincipal;
import com.medicare.hms.service.impl.BillingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BillingServiceTest {

    @Mock
    private BillRepository billRepository;

    @Mock
    private BillItemRepository billItemRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogService auditLogService;

    @Spy
    private EntityDtoMapper mapper = new EntityDtoMapper();

    @InjectMocks
    private BillingServiceImpl billingService;

    private Patient samplePatient;
    private UserPrincipal billingStaffPrincipal;

    @BeforeEach
    void setUp() {
        samplePatient = new Patient(1L, "MED-2026-0001", "Eleanor Vance", LocalDate.of(1985, 4, 12),
                "FEMALE", "+15559012345", "eleanor@example.com", "Address", "Contact", "+15559012346", "O+", true);

        billingStaffPrincipal = new UserPrincipal(2L, "billing", "pass", "billing@medicare.com", "David Kim", Role.BILLING_STAFF, true);
    }

    @Test
    void testGenerateBill_Calculations() {
        // Consultation = 500, Item 1 = 300, Item 2 = 200 => Subtotal = 1000
        // Discount = 100 => Net = 900
        // Tax rate = 10% => Tax = 90 => Total = 990
        BillGenerateRequest request = new BillGenerateRequest();
        request.setPatientId(1L);
        request.setConsultationCharge(BigDecimal.valueOf(500.00));
        request.setDiscount(BigDecimal.valueOf(100.00));
        request.setTaxRate(BigDecimal.valueOf(10.00));
        request.setItems(List.of(
                new BillItemRequest("Blood Sugar Test", 1, BigDecimal.valueOf(300.00)),
                new BillItemRequest("Urine Routine Test", 1, BigDecimal.valueOf(200.00))
        ));

        when(patientRepository.findById(1L)).thenReturn(Optional.of(samplePatient));
        when(billRepository.count()).thenReturn(0L);
        when(billRepository.existsByBillNumber(anyString())).thenReturn(false);
        when(billRepository.save(any(Bill.class))).thenAnswer(invocation -> {
            Bill b = invocation.getArgument(0);
            b.setId(1L);
            return b;
        });

        BillResponse response = billingService.generateBill(request, billingStaffPrincipal);

        assertNotNull(response);
        assertEquals(0, BigDecimal.valueOf(990.00).compareTo(response.getTotalAmount()));
        assertEquals(0, BigDecimal.valueOf(990.00).compareTo(response.getBalanceDue()));
        assertEquals(0, BigDecimal.ZERO.compareTo(response.getPaidAmount()));
        assertEquals(BillPaymentStatus.UNPAID, response.getPaymentStatus());
    }

    @Test
    void testRecordPayment_PartialPayment() {
        Bill bill = new Bill();
        bill.setId(1L);
        bill.setBillNumber("INV-2026-0001");
        bill.setPatient(samplePatient);
        bill.setTotalAmount(BigDecimal.valueOf(1000.00));
        bill.setPaidAmount(BigDecimal.ZERO);
        bill.setBalanceDue(BigDecimal.valueOf(1000.00));
        bill.setPaymentStatus(BillPaymentStatus.UNPAID);

        when(billRepository.findById(1L)).thenReturn(Optional.of(bill));
        when(paymentRepository.count()).thenReturn(0L);
        when(paymentRepository.existsByPaymentReference(anyString())).thenReturn(false);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment p = invocation.getArgument(0);
            p.setId(10L);
            return p;
        });
        when(billRepository.save(any(Bill.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentRecordRequest paymentRequest = new PaymentRecordRequest(BigDecimal.valueOf(400.00), "CASH", "REC-1", "Partial cash deposit");
        PaymentResponse response = billingService.recordPayment(1L, paymentRequest, billingStaffPrincipal);

        assertNotNull(response);
        assertEquals(0, BigDecimal.valueOf(400.00).compareTo(response.getAmount()));
        assertEquals(0, BigDecimal.valueOf(400.00).compareTo(bill.getPaidAmount()));
        assertEquals(0, BigDecimal.valueOf(600.00).compareTo(bill.getBalanceDue()));
        assertEquals(BillPaymentStatus.PARTIALLY_PAID, bill.getPaymentStatus());
    }

    @Test
    void testRecordPayment_FullPayment() {
        Bill bill = new Bill();
        bill.setId(2L);
        bill.setBillNumber("INV-2026-0002");
        bill.setPatient(samplePatient);
        bill.setTotalAmount(BigDecimal.valueOf(500.00));
        bill.setPaidAmount(BigDecimal.ZERO);
        bill.setBalanceDue(BigDecimal.valueOf(500.00));
        bill.setPaymentStatus(BillPaymentStatus.UNPAID);

        when(billRepository.findById(2L)).thenReturn(Optional.of(bill));
        when(paymentRepository.count()).thenReturn(0L);
        when(paymentRepository.existsByPaymentReference(anyString())).thenReturn(false);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(billRepository.save(any(Bill.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentRecordRequest paymentRequest = new PaymentRecordRequest(BigDecimal.valueOf(500.00), "UPI", "UPI-TRANS-98", "Full payment");
        billingService.recordPayment(2L, paymentRequest, billingStaffPrincipal);

        assertEquals(0, BigDecimal.valueOf(500.00).compareTo(bill.getPaidAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(bill.getBalanceDue()));
        assertEquals(BillPaymentStatus.PAID, bill.getPaymentStatus());
    }

    @Test
    void testRecordPayment_ExceedsBalanceRejected() {
        Bill bill = new Bill();
        bill.setId(3L);
        bill.setTotalAmount(BigDecimal.valueOf(200.00));
        bill.setBalanceDue(BigDecimal.valueOf(200.00));
        bill.setPaymentStatus(BillPaymentStatus.UNPAID);

        when(billRepository.findById(3L)).thenReturn(Optional.of(bill));

        PaymentRecordRequest paymentRequest = new PaymentRecordRequest(BigDecimal.valueOf(250.00), "CASH", null, null);

        assertThrows(BadRequestException.class, () -> billingService.recordPayment(3L, paymentRequest, billingStaffPrincipal));
    }
}
