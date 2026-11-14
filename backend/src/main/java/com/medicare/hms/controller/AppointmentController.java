package com.medicare.hms.controller;

import com.medicare.hms.dto.request.AppointmentBookingRequest;
import com.medicare.hms.dto.request.AppointmentCancelRequest;
import com.medicare.hms.dto.request.AppointmentRescheduleRequest;
import com.medicare.hms.dto.response.ApiResponse;
import com.medicare.hms.dto.response.AppointmentResponse;
import com.medicare.hms.dto.response.PagedResponse;
import com.medicare.hms.entity.AppointmentStatus;
import com.medicare.hms.security.UserPrincipal;
import com.medicare.hms.service.AppointmentService;
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

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/appointments")
@Tag(name = "Appointment Management", description = "Endpoints for appointment booking, conflict checks, rescheduling, cancellation, and status transitions")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR')")
    @Operation(summary = "Book an appointment with conflict and working hour validation")
    public ResponseEntity<ApiResponse<AppointmentResponse>> bookAppointment(
            @Valid @RequestBody AppointmentBookingRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        AppointmentResponse response = appointmentService.bookAppointment(request, principal);
        return new ResponseEntity<>(ApiResponse.success("Appointment booked successfully", response), HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'BILLING_STAFF')")
    @Operation(summary = "Get appointments list with search and filters")
    public ResponseEntity<ApiResponse<PagedResponse<AppointmentResponse>>> getAppointments(
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "appointmentDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PagedResponse<AppointmentResponse> response = appointmentService.getAppointments(
                doctorId, patientId, status, startDate, endDate, search, PageRequest.of(page, size, sort)
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'BILLING_STAFF')")
    @Operation(summary = "Get list of today's appointments")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getTodayAppointments() {
        List<AppointmentResponse> response = appointmentService.getTodayAppointments();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'BILLING_STAFF')")
    @Operation(summary = "Get appointment details by ID")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(@PathVariable Long id) {
        AppointmentResponse response = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/reschedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR')")
    @Operation(summary = "Reschedule an appointment to a new date and time slot")
    public ResponseEntity<ApiResponse<AppointmentResponse>> rescheduleAppointment(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentRescheduleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        AppointmentResponse response = appointmentService.rescheduleAppointment(id, request, principal);
        return ResponseEntity.ok(ApiResponse.success("Appointment rescheduled successfully", response));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR')")
    @Operation(summary = "Cancel an appointment with a documented reason")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancelAppointment(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentCancelRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        AppointmentResponse response = appointmentService.cancelAppointment(id, request, principal);
        return ResponseEntity.ok(ApiResponse.success("Appointment cancelled", response));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    @Operation(summary = "Mark an appointment as COMPLETED (ADMIN, DOCTOR)")
    public ResponseEntity<ApiResponse<AppointmentResponse>> completeAppointment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        AppointmentResponse response = appointmentService.completeAppointment(id, principal);
        return ResponseEntity.ok(ApiResponse.success("Appointment marked as completed", response));
    }

    @PatchMapping("/{id}/no-show")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR')")
    @Operation(summary = "Mark an appointment as NO_SHOW")
    public ResponseEntity<ApiResponse<AppointmentResponse>> markNoShow(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        AppointmentResponse response = appointmentService.markNoShow(id, principal);
        return ResponseEntity.ok(ApiResponse.success("Appointment marked as no-show", response));
    }
}
