package com.medicare.hms.dto.response;

import java.util.ArrayList;
import java.util.List;

public class AppointmentReportResponse {

    private long totalScheduled;
    private long totalConfirmed;
    private long totalCompleted;
    private long totalCancelled;
    private long totalNoShow;
    private long totalAll;
    private List<AppointmentResponse> appointments = new ArrayList<>();

    public AppointmentReportResponse() {
    }

    public long getTotalScheduled() {
        return totalScheduled;
    }

    public void setTotalScheduled(long totalScheduled) {
        this.totalScheduled = totalScheduled;
    }

    public long getTotalConfirmed() {
        return totalConfirmed;
    }

    public void setTotalConfirmed(long totalConfirmed) {
        this.totalConfirmed = totalConfirmed;
    }

    public long getTotalCompleted() {
        return totalCompleted;
    }

    public void setTotalCompleted(long totalCompleted) {
        this.totalCompleted = totalCompleted;
    }

    public long getTotalCancelled() {
        return totalCancelled;
    }

    public void setTotalCancelled(long totalCancelled) {
        this.totalCancelled = totalCancelled;
    }

    public long getTotalNoShow() {
        return totalNoShow;
    }

    public void setTotalNoShow(long totalNoShow) {
        this.totalNoShow = totalNoShow;
    }

    public long getTotalAll() {
        return totalAll;
    }

    public void setTotalAll(long totalAll) {
        this.totalAll = totalAll;
    }

    public List<AppointmentResponse> getAppointments() {
        return appointments;
    }

    public void setAppointments(List<AppointmentResponse> appointments) {
        this.appointments = appointments;
    }
}
