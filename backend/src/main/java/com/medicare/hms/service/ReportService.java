package com.medicare.hms.service;

import com.medicare.hms.dto.response.AppointmentReportResponse;
import com.medicare.hms.dto.response.BillingReportResponse;
import com.medicare.hms.dto.response.DashboardStatsResponse;

import java.time.LocalDate;
import java.time.LocalDateTime;

public interface ReportService {
    DashboardStatsResponse getDashboardStats();
    AppointmentReportResponse getAppointmentReport(LocalDate startDate, LocalDate endDate, Long doctorId);
    BillingReportResponse getBillingReport(LocalDateTime startDate, LocalDateTime endDate);
    byte[] exportAppointmentsCsv(LocalDate startDate, LocalDate endDate);
    byte[] exportBillingCsv(LocalDateTime startDate, LocalDateTime endDate);
}
