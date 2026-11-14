package com.medicare.hms.dto.response;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class DashboardStatsResponse {

    // Summary Card Metrics
    private long totalPatients;
    private long activeDoctors;
    private long todayAppointments;
    private long pendingAppointments;
    private long completedAppointments;
    private long pendingBills;
    private BigDecimal revenueCollected;
    private BigDecimal outstandingBalance;

    // Charts
    private List<DailyAppointmentCount> appointmentsByDay = new ArrayList<>();
    private List<StatusCount> appointmentStatusDistribution = new ArrayList<>();
    private List<MonthlyBillingSummary> monthlyBillingTotals = new ArrayList<>();
    private List<DoctorWorkload> doctorWorkload = new ArrayList<>();

    // Lists
    private List<AppointmentResponse> recentAppointments = new ArrayList<>();
    private List<PatientResponse> recentlyRegisteredPatients = new ArrayList<>();
    private List<AppointmentResponse> upcomingAppointments = new ArrayList<>();

    public DashboardStatsResponse() {
    }

    public static class DailyAppointmentCount {
        private String date;
        private long count;

        public DailyAppointmentCount() {}
        public DailyAppointmentCount(String date, long count) {
            this.date = date;
            this.count = count;
        }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }
    }

    public static class StatusCount {
        private String status;
        private long count;

        public StatusCount() {}
        public StatusCount(String status, long count) {
            this.status = status;
            this.count = count;
        }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }
    }

    public static class MonthlyBillingSummary {
        private String month;
        private BigDecimal billed;
        private BigDecimal collected;

        public MonthlyBillingSummary() {}
        public MonthlyBillingSummary(String month, BigDecimal billed, BigDecimal collected) {
            this.month = month;
            this.billed = billed;
            this.collected = collected;
        }

        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }
        public BigDecimal getBilled() { return billed; }
        public void setBilled(BigDecimal billed) { this.billed = billed; }
        public BigDecimal getCollected() { return collected; }
        public void setCollected(BigDecimal collected) { this.collected = collected; }
    }

    public static class DoctorWorkload {
        private String doctorName;
        private String specialization;
        private long appointmentCount;

        public DoctorWorkload() {}
        public DoctorWorkload(String doctorName, String specialization, long appointmentCount) {
            this.doctorName = doctorName;
            this.specialization = specialization;
            this.appointmentCount = appointmentCount;
        }

        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
        public String getSpecialization() { return specialization; }
        public void setSpecialization(String specialization) { this.specialization = specialization; }
        public long getAppointmentCount() { return appointmentCount; }
        public void setAppointmentCount(long appointmentCount) { this.appointmentCount = appointmentCount; }
    }

    public long getTotalPatients() { return totalPatients; }
    public void setTotalPatients(long totalPatients) { this.totalPatients = totalPatients; }

    public long getActiveDoctors() { return activeDoctors; }
    public void setActiveDoctors(long activeDoctors) { this.activeDoctors = activeDoctors; }

    public long getTodayAppointments() { return todayAppointments; }
    public void setTodayAppointments(long todayAppointments) { this.todayAppointments = todayAppointments; }

    public long getPendingAppointments() { return pendingAppointments; }
    public void setPendingAppointments(long pendingAppointments) { this.pendingAppointments = pendingAppointments; }

    public long getCompletedAppointments() { return completedAppointments; }
    public void setCompletedAppointments(long completedAppointments) { this.completedAppointments = completedAppointments; }

    public long getPendingBills() { return pendingBills; }
    public void setPendingBills(long pendingBills) { this.pendingBills = pendingBills; }

    public BigDecimal getRevenueCollected() { return revenueCollected; }
    public void setRevenueCollected(BigDecimal revenueCollected) { this.revenueCollected = revenueCollected; }

    public BigDecimal getOutstandingBalance() { return outstandingBalance; }
    public void setOutstandingBalance(BigDecimal outstandingBalance) { this.outstandingBalance = outstandingBalance; }

    public List<DailyAppointmentCount> getAppointmentsByDay() { return appointmentsByDay; }
    public void setAppointmentsByDay(List<DailyAppointmentCount> appointmentsByDay) { this.appointmentsByDay = appointmentsByDay; }

    public List<StatusCount> getAppointmentStatusDistribution() { return appointmentStatusDistribution; }
    public void setAppointmentStatusDistribution(List<StatusCount> appointmentStatusDistribution) { this.appointmentStatusDistribution = appointmentStatusDistribution; }

    public List<MonthlyBillingSummary> getMonthlyBillingTotals() { return monthlyBillingTotals; }
    public void setMonthlyBillingTotals(List<MonthlyBillingSummary> monthlyBillingTotals) { this.monthlyBillingTotals = monthlyBillingTotals; }

    public List<DoctorWorkload> getDoctorWorkload() { return doctorWorkload; }
    public void setDoctorWorkload(List<DoctorWorkload> doctorWorkload) { this.doctorWorkload = doctorWorkload; }

    public List<AppointmentResponse> getRecentAppointments() { return recentAppointments; }
    public void setRecentAppointments(List<AppointmentResponse> recentAppointments) { this.recentAppointments = recentAppointments; }

    public List<PatientResponse> getRecentlyRegisteredPatients() { return recentlyRegisteredPatients; }
    public void setRecentlyRegisteredPatients(List<PatientResponse> recentlyRegisteredPatients) { this.recentlyRegisteredPatients = recentlyRegisteredPatients; }

    public List<AppointmentResponse> getUpcomingAppointments() { return upcomingAppointments; }
    public void setUpcomingAppointments(List<AppointmentResponse> upcomingAppointments) { this.upcomingAppointments = upcomingAppointments; }
}
