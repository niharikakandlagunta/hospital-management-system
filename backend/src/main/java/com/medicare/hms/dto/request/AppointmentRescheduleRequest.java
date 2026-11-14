package com.medicare.hms.dto.request;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public class AppointmentRescheduleRequest {

    @NotNull(message = "New appointment date is required")
    private LocalDate newDate;

    @NotNull(message = "New start time is required")
    private LocalTime newStartTime;

    private Integer durationMinutes;

    public AppointmentRescheduleRequest() {
    }

    public LocalDate getNewDate() {
        return newDate;
    }

    public void setNewDate(LocalDate newDate) {
        this.newDate = newDate;
    }

    public LocalTime getNewStartTime() {
        return newStartTime;
    }

    public void setNewStartTime(LocalTime newStartTime) {
        this.newStartTime = newStartTime;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }
}
