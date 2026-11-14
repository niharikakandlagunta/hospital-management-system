package com.medicare.hms.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class BillGenerateRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private Long appointmentId;

    @DecimalMin(value = "0.0", inclusive = true, message = "Consultation charge must be non-negative")
    private BigDecimal consultationCharge = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true, message = "Discount must be non-negative")
    private BigDecimal discount = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true, message = "Tax rate must be non-negative")
    private BigDecimal taxRate = BigDecimal.ZERO;

    private LocalDate dueDate;

    private String notes;

    @Valid
    private List<BillItemRequest> items = new ArrayList<>();

    public BillGenerateRequest() {
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public BigDecimal getConsultationCharge() {
        return consultationCharge;
    }

    public void setConsultationCharge(BigDecimal consultationCharge) {
        this.consultationCharge = consultationCharge;
    }

    public BigDecimal getDiscount() {
        return discount;
    }

    public void setDiscount(BigDecimal discount) {
        this.discount = discount;
    }

    public BigDecimal getTaxRate() {
        return taxRate;
    }

    public void setTaxRate(BigDecimal taxRate) {
        this.taxRate = taxRate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<BillItemRequest> getItems() {
        return items;
    }

    public void setItems(List<BillItemRequest> items) {
        this.items = items;
    }
}
