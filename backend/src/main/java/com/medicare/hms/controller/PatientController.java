package com.medicare.hms.controller;

import com.medicare.hms.dto.request.PatientRequest;
import com.medicare.hms.dto.response.ApiResponse;
import com.medicare.hms.dto.response.AppointmentResponse;
import com.medicare.hms.dto.response.PagedResponse;
import com.medicare.hms.dto.response.PatientResponse;
import com.medicare.hms.security.UserPrincipal;
import com.medicare.hms.service.AppointmentService;
import com.medicare.hms.service.PatientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patients")
@Tag(name = "Patient Management", description = "Endpoints for patient registration, search, details, and deactivation")
public class PatientController {

    private final PatientService patientService;
    private final AppointmentService appointmentService;

    public PatientController(PatientService patientService, AppointmentService appointmentService) {
        this.patientService = patientService;
        this.appointmentService = appointmentService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @Operation(summary = "Register a new patient (ADMIN, RECEPTIONIST)")
    public ResponseEntity<ApiResponse<PatientResponse>> createPatient(
            @Valid @RequestBody PatientRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        PatientResponse response = patientService.createPatient(request, principal != null ? principal.getUsername() : "STAFF");
        return new ResponseEntity<>(ApiResponse.success("Patient registered successfully", response), HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'BILLING_STAFF')")
    @Operation(summary = "Get patients list with search, filter, and pagination")
    public ResponseEntity<ApiResponse<PagedResponse<PatientResponse>>> getPatients(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PagedResponse<PatientResponse> response = patientService.getPatients(search, active, PageRequest.of(page, size, sort));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'BILLING_STAFF')")
    @Operation(summary = "Get patient details by ID")
    public ResponseEntity<ApiResponse<PatientResponse>> getPatientById(@PathVariable Long id) {
        PatientResponse response = patientService.getPatientById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @Operation(summary = "Update patient information (ADMIN, RECEPTIONIST)")
    public ResponseEntity<ApiResponse<PatientResponse>> updatePatient(
            @PathVariable Long id,
            @Valid @RequestBody PatientRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        PatientResponse response = patientService.updatePatient(id, request, principal != null ? principal.getUsername() : "STAFF");
        return ResponseEntity.ok(ApiResponse.success("Patient details updated successfully", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @Operation(summary = "Set patient active/inactive status (controlled deactivation)")
    public ResponseEntity<ApiResponse<PatientResponse>> setPatientStatus(
            @PathVariable Long id,
            @RequestParam boolean active,
            @AuthenticationPrincipal UserPrincipal principal) {
        PatientResponse response = patientService.setPatientStatus(id, active, principal != null ? principal.getUsername() : "STAFF");
        return ResponseEntity.ok(ApiResponse.success("Patient status updated to " + (active ? "Active" : "Inactive"), response));
    }

    @GetMapping("/{id}/appointments")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'BILLING_STAFF')")
    @Operation(summary = "Get appointment history for a patient")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getPatientAppointments(@PathVariable Long id) {
        List<AppointmentResponse> response = appointmentService.getPatientAppointments(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
