package com.medicare.hms.controller;

import com.medicare.hms.dto.request.BillGenerateRequest;
import com.medicare.hms.dto.request.PaymentRecordRequest;
import com.medicare.hms.dto.response.ApiResponse;
import com.medicare.hms.dto.response.BillResponse;
import com.medicare.hms.dto.response.PagedResponse;
import com.medicare.hms.dto.response.PaymentResponse;
import com.medicare.hms.entity.BillPaymentStatus;
import com.medicare.hms.security.UserPrincipal;
import com.medicare.hms.service.BillingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Billing & Payments", description = "Endpoints for invoice generation, itemized charges, and payment recording")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @PostMapping("/bills")
    @PreAuthorize("hasAnyRole('ADMIN', 'BILLING_STAFF')")
    @Operation(summary = "Generate a new bill with itemized charges (ADMIN, BILLING_STAFF)")
    public ResponseEntity<ApiResponse<BillResponse>> generateBill(
            @Valid @RequestBody BillGenerateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        BillResponse response = billingService.generateBill(request, principal);
        return new ResponseEntity<>(ApiResponse.success("Bill generated successfully", response), HttpStatus.CREATED);
    }

    @GetMapping("/bills")
    @PreAuthorize("hasAnyRole('ADMIN', 'BILLING_STAFF', 'RECEPTIONIST')")
    @Operation(summary = "List bills with status filter, search, and pagination")
    public ResponseEntity<ApiResponse<PagedResponse<BillResponse>>> getBills(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) BillPaymentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PagedResponse<BillResponse> response = billingService.getBills(patientId, status, startDate, endDate, search, PageRequest.of(page, size, sort));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/bills/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BILLING_STAFF', 'RECEPTIONIST')")
    @Operation(summary = "Get bill details and printable invoice data by ID")
    public ResponseEntity<ApiResponse<BillResponse>> getBillById(@PathVariable Long id) {
        BillResponse response = billingService.getBillById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/bills/{id}/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'BILLING_STAFF')")
    @Operation(summary = "Record a full or partial payment against a bill (ADMIN, BILLING_STAFF)")
    public ResponseEntity<ApiResponse<PaymentResponse>> recordPayment(
            @PathVariable Long id,
            @Valid @RequestBody PaymentRecordRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        PaymentResponse response = billingService.recordPayment(id, request, principal);
        return new ResponseEntity<>(ApiResponse.success("Payment recorded successfully", response), HttpStatus.CREATED);
    }

    @GetMapping("/bills/{id}/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'BILLING_STAFF', 'RECEPTIONIST')")
    @Operation(summary = "Get list of payments recorded for a bill")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getBillPayments(@PathVariable Long id) {
        List<PaymentResponse> response = billingService.getBillPayments(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'BILLING_STAFF')")
    @Operation(summary = "Get all payments history with pagination (ADMIN, BILLING_STAFF)")
    public ResponseEntity<ApiResponse<PagedResponse<PaymentResponse>>> getAllPayments(
            @RequestParam(required = false) Long billId,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<PaymentResponse> response = billingService.getAllPayments(
                billId, paymentMethod, startDate, endDate,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "paymentTimestamp"))
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
