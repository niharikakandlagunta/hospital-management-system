package com.medicare.hms.service;

import com.medicare.hms.dto.request.BillGenerateRequest;
import com.medicare.hms.dto.request.PaymentRecordRequest;
import com.medicare.hms.dto.response.BillResponse;
import com.medicare.hms.dto.response.PagedResponse;
import com.medicare.hms.dto.response.PaymentResponse;
import com.medicare.hms.entity.BillPaymentStatus;
import com.medicare.hms.security.UserPrincipal;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface BillingService {
    BillResponse generateBill(BillGenerateRequest request, UserPrincipal currentUser);
    PaymentResponse recordPayment(Long billId, PaymentRecordRequest request, UserPrincipal currentUser);
    BillResponse getBillById(Long id);
    BillResponse getBillByBillNumber(String billNumber);
    PagedResponse<BillResponse> getBills(Long patientId, BillPaymentStatus status, LocalDateTime startDate,
                                        LocalDateTime endDate, String search, Pageable pageable);
    List<PaymentResponse> getBillPayments(Long billId);
    PagedResponse<PaymentResponse> getAllPayments(Long billId, String paymentMethod, LocalDateTime startDate,
                                                 LocalDateTime endDate, Pageable pageable);
}
