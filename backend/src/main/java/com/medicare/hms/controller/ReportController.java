package com.medicare.hms.controller;

import com.medicare.hms.dto.response.ApiResponse;
import com.medicare.hms.dto.response.AppointmentReportResponse;
import com.medicare.hms.dto.response.BillingReportResponse;
import com.medicare.hms.dto.response.DashboardStatsResponse;
import com.medicare.hms.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/reports")
@PreAuthorize("hasAnyRole('ADMIN', 'BILLING_STAFF')")
@Tag(name = "Reports & Analytics", description = "Endpoints for dashboard statistics, aggregated reports, and CSV exports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'BILLING_STAFF')")
    @Operation(summary = "Get aggregated dashboard statistics and real-data charts")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats() {
        DashboardStatsResponse stats = reportService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/appointments")
    @Operation(summary = "Get detailed appointments report for a date range")
    public ResponseEntity<ApiResponse<AppointmentReportResponse>> getAppointmentReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long doctorId) {
        AppointmentReportResponse response = reportService.getAppointmentReport(startDate, endDate, doctorId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/billing")
    @Operation(summary = "Get financial billing and collections report")
    public ResponseEntity<ApiResponse<BillingReportResponse>> getBillingReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        BillingReportResponse response = reportService.getBillingReport(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/appointments/export")
    @Operation(summary = "Export appointments report as CSV file")
    public ResponseEntity<byte[]> exportAppointmentsCsv(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        byte[] csvData = reportService.exportAppointmentsCsv(startDate, endDate);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"appointments_report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }

    @GetMapping("/billing/export")
    @Operation(summary = "Export billing report as CSV file")
    public ResponseEntity<byte[]> exportBillingCsv(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        byte[] csvData = reportService.exportBillingCsv(startDate, endDate);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"billing_report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }
}
