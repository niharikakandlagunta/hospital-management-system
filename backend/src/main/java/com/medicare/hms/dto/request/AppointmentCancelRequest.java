package com.medicare.hms.dto.request;

import jakarta.validation.constraints.NotBlank;

public class AppointmentCancelRequest {

    @NotBlank(message = "Cancellation reason is required")
    private String reason;

    public AppointmentCancelRequest() {
    }

    public AppointmentCancelRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
