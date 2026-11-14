package com.medicare.hms.service.impl;

import com.medicare.hms.dto.response.*;
import com.medicare.hms.entity.*;
import com.medicare.hms.mapper.EntityDtoMapper;
import com.medicare.hms.repository.*;
import com.medicare.hms.service.ReportService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportServiceImpl implements ReportService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final BillRepository billRepository;
    private final EntityDtoMapper mapper;

    public ReportServiceImpl(PatientRepository patientRepository,
                             DoctorRepository doctorRepository,
                             AppointmentRepository appointmentRepository,
                             BillRepository billRepository,
                             EntityDtoMapper mapper) {
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.billRepository = billRepository;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        DashboardStatsResponse stats = new DashboardStatsResponse();

        // 1. Summary Cards
        stats.setTotalPatients(patientRepository.count());
        stats.setActiveDoctors(doctorRepository.countByAvailableTrue());
        stats.setTodayAppointments(appointmentRepository.countByAppointmentDate(LocalDate.now()));
        stats.setPendingAppointments(appointmentRepository.countByStatus(AppointmentStatus.SCHEDULED));
        stats.setCompletedAppointments(appointmentRepository.countByStatus(AppointmentStatus.COMPLETED));

        long unpaidBills = billRepository.countByPaymentStatus(BillPaymentStatus.UNPAID);
        long partialBills = billRepository.countByPaymentStatus(BillPaymentStatus.PARTIALLY_PAID);
        stats.setPendingBills(unpaidBills + partialBills);

        BigDecimal revenue = billRepository.sumTotalRevenue();
        stats.setRevenueCollected(revenue != null ? revenue : BigDecimal.ZERO);

        BigDecimal outstanding = billRepository.sumTotalOutstanding();
        stats.setOutstandingBalance(outstanding != null ? outstanding : BigDecimal.ZERO);

        // 2. Appointments by Day (Past 7 days)
        LocalDate today = LocalDate.now();
        List<DashboardStatsResponse.DailyAppointmentCount> dailyCounts = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            long count = appointmentRepository.countByAppointmentDate(d);
            dailyCounts.add(new DashboardStatsResponse.DailyAppointmentCount(d.toString(), count));
        }
        stats.setAppointmentsByDay(dailyCounts);

        // 3. Appointment Status Distribution
        List<DashboardStatsResponse.StatusCount> statusCounts = new ArrayList<>();
        for (AppointmentStatus st : AppointmentStatus.values()) {
            long count = appointmentRepository.countByStatus(st);
            statusCounts.add(new DashboardStatsResponse.StatusCount(st.name(), count));
        }
        stats.setAppointmentStatusDistribution(statusCounts);

        // 4. Monthly Billing Totals (Current month summary)
        String currentMonth = today.format(DateTimeFormatter.ofPattern("MMM yyyy"));
        BigDecimal totalBilled = billRepository.sumTotalBilled();
        stats.setMonthlyBillingTotals(List.of(
                new DashboardStatsResponse.MonthlyBillingSummary(
                        currentMonth,
                        totalBilled != null ? totalBilled : BigDecimal.ZERO,
                        revenue != null ? revenue : BigDecimal.ZERO
                )
        ));

        // 5. Doctor Workload
        List<Doctor> doctors = doctorRepository.findAll();
        List<DashboardStatsResponse.DoctorWorkload> workloads = new ArrayList<>();
        for (Doctor doc : doctors) {
            long count = appointmentRepository.findWithFilters(doc.getId(), null, null, null, null, null, PageRequest.of(0, 1)).getTotalElements();
            workloads.add(new DashboardStatsResponse.DoctorWorkload(doc.getFullName(), doc.getSpecialization(), count));
        }
        stats.setDoctorWorkload(workloads);

        // 6. Recent Appointments (Top 5)
        List<Appointment> recentList = appointmentRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();
        stats.setRecentAppointments(recentList.stream().map(mapper::toAppointmentResponse).collect(Collectors.toList()));

        // 7. Recently Registered Patients (Top 5)
        List<Patient> recentPatients = patientRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();
        stats.setRecentlyRegisteredPatients(recentPatients.stream().map(mapper::toPatientResponse).collect(Collectors.toList()));

        // 8. Upcoming Appointments (Top 5 scheduled from today onwards)
        List<Appointment> upcoming = appointmentRepository.findWithFilters(
                null, null, AppointmentStatus.SCHEDULED, today, null, null,
                PageRequest.of(0, 5, Sort.by(Sort.Direction.ASC, "appointmentDate", "startTime"))
        ).getContent();
        stats.setUpcomingAppointments(upcoming.stream().map(mapper::toAppointmentResponse).collect(Collectors.toList()));

        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentReportResponse getAppointmentReport(LocalDate startDate, LocalDate endDate, Long doctorId) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusMonths(1);
        LocalDate end = endDate != null ? endDate : LocalDate.now().plusMonths(1);

        List<Appointment> list = appointmentRepository.findWithFilters(
                doctorId, null, null, start, end, null, PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "appointmentDate"))
        ).getContent();

        AppointmentReportResponse report = new AppointmentReportResponse();
        report.setTotalAll(list.size());
        report.setTotalScheduled(list.stream().filter(a -> a.getStatus() == AppointmentStatus.SCHEDULED).count());
        report.setTotalConfirmed(list.stream().filter(a -> a.getStatus() == AppointmentStatus.CONFIRMED).count());
        report.setTotalCompleted(list.stream().filter(a -> a.getStatus() == AppointmentStatus.COMPLETED).count());
        report.setTotalCancelled(list.stream().filter(a -> a.getStatus() == AppointmentStatus.CANCELLED).count());
        report.setTotalNoShow(list.stream().filter(a -> a.getStatus() == AppointmentStatus.NO_SHOW).count());
        report.setAppointments(list.stream().map(mapper::toAppointmentResponse).collect(Collectors.toList()));

        return report;
    }

    @Override
    @Transactional(readOnly = true)
    public BillingReportResponse getBillingReport(LocalDateTime startDate, LocalDateTime endDate) {
        LocalDateTime start = startDate != null ? startDate : LocalDateTime.now().minusMonths(1);
        LocalDateTime end = endDate != null ? endDate : LocalDateTime.now().plusDays(1);

        List<Bill> list = billRepository.findWithFilters(
                null, null, start, end, null, PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();

        BigDecimal billed = BigDecimal.ZERO;
        BigDecimal collected = BigDecimal.ZERO;
        BigDecimal outstanding = BigDecimal.ZERO;
        long paidCount = 0;
        long pendingCount = 0;

        for (Bill b : list) {
            if (b.getPaymentStatus() != BillPaymentStatus.VOID) {
                billed = billed.add(b.getTotalAmount());
                collected = collected.add(b.getPaidAmount());
                outstanding = outstanding.add(b.getBalanceDue());
            }
            if (b.getPaymentStatus() == BillPaymentStatus.PAID) {
                paidCount++;
            } else if (b.getPaymentStatus() == BillPaymentStatus.UNPAID || b.getPaymentStatus() == BillPaymentStatus.PARTIALLY_PAID) {
                pendingCount++;
            }
        }

        BillingReportResponse report = new BillingReportResponse();
        report.setTotalBilled(billed);
        report.setTotalCollected(collected);
        report.setTotalOutstanding(outstanding);
        report.setTotalBillsCount(list.size());
        report.setPaidBillsCount(paidCount);
        report.setPendingBillsCount(pendingCount);
        report.setBills(list.stream().map(mapper::toBillResponse).collect(Collectors.toList()));

        return report;
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportAppointmentsCsv(LocalDate startDate, LocalDate endDate) {
        AppointmentReportResponse report = getAppointmentReport(startDate, endDate, null);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8);

        writer.println("Reference,Patient Name,Patient ID,Doctor Name,Specialization,Date,Start Time,End Time,Status,Reason");
        for (AppointmentResponse a : report.getAppointments()) {
            writer.printf("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"%n",
                    a.getAppointmentReference(),
                    escapeCsv(a.getPatientName()),
                    a.getPatientRegistrationNumber(),
                    escapeCsv(a.getDoctorName()),
                    escapeCsv(a.getDoctorSpecialization()),
                    a.getAppointmentDate(),
                    a.getStartTime(),
                    a.getEndTime(),
                    a.getStatus(),
                    escapeCsv(a.getReasonForVisit())
            );
        }
        writer.flush();
        return out.toByteArray();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportBillingCsv(LocalDateTime startDate, LocalDateTime endDate) {
        BillingReportResponse report = getBillingReport(startDate, endDate);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8);

        writer.println("Bill Number,Patient Name,Patient Reg#,Consultation Fee,Additional Charges,Discount,Tax,Total Amount,Paid Amount,Balance Due,Status,Date");
        for (BillResponse b : report.getBills()) {
            writer.printf("\"%s\",\"%s\",\"%s\",%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,\"%s\",\"%s\"%n",
                    b.getBillNumber(),
                    escapeCsv(b.getPatientName()),
                    b.getPatientRegistrationNumber(),
                    b.getConsultationCharge(),
                    b.getAdditionalCharges(),
                    b.getDiscount(),
                    b.getTaxAmount(),
                    b.getTotalAmount(),
                    b.getPaidAmount(),
                    b.getBalanceDue(),
                    b.getPaymentStatus(),
                    b.getCreatedAt() != null ? b.getCreatedAt().toString() : ""
            );
        }
        writer.flush();
        return out.toByteArray();
    }

    private String escapeCsv(String input) {
        if (input == null) return "";
        return input.replace("\"", "\"\"");
    }
}
