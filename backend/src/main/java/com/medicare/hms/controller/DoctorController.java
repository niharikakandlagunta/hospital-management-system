package com.medicare.hms.controller;

import com.medicare.hms.dto.request.DoctorRequest;
import com.medicare.hms.dto.request.DoctorScheduleRequest;
import com.medicare.hms.dto.response.ApiResponse;
import com.medicare.hms.dto.response.AppointmentResponse;
import com.medicare.hms.dto.response.DoctorResponse;
import com.medicare.hms.dto.response.DoctorScheduleResponse;
import com.medicare.hms.dto.response.PagedResponse;
import com.medicare.hms.security.UserPrincipal;
import com.medicare.hms.service.AppointmentService;
import com.medicare.hms.service.DoctorService;
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
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/doctors")
@Tag(name = "Doctor Management", description = "Endpoints for doctor directory, profiles, working schedules, and availability")
public class DoctorController {

    private final DoctorService doctorService;
    private final AppointmentService appointmentService;

    public DoctorController(DoctorService doctorService, AppointmentService appointmentService) {
        this.doctorService = doctorService;
        this.appointmentService = appointmentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add a new doctor to the hospital directory (ADMIN only)")
    public ResponseEntity<ApiResponse<DoctorResponse>> createDoctor(
            @Valid @RequestBody DoctorRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        DoctorResponse response = doctorService.createDoctor(request, principal != null ? principal.getUsername() : "ADMIN");
        return new ResponseEntity<>(ApiResponse.success("Doctor added successfully", response), HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "Get doctor directory with search, filter by specialization and department")
    public ResponseEntity<ApiResponse<PagedResponse<DoctorResponse>>> getDoctors(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Boolean available,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fullName") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PagedResponse<DoctorResponse> response = doctorService.getDoctors(search, departmentId, available, PageRequest.of(page, size, sort));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get doctor profile by ID")
    public ResponseEntity<ApiResponse<DoctorResponse>> getDoctorById(@PathVariable Long id) {
        DoctorResponse response = doctorService.getDoctorById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    @Operation(summary = "Update doctor details (ADMIN, DOCTOR)")
    public ResponseEntity<ApiResponse<DoctorResponse>> updateDoctor(
            @PathVariable Long id,
            @Valid @RequestBody DoctorRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        DoctorResponse response = doctorService.updateDoctor(id, request, principal != null ? principal.getUsername() : "ADMIN");
        return ResponseEntity.ok(ApiResponse.success("Doctor details updated successfully", response));
    }

    @GetMapping(value = {"/{id}/availability", "/{id}/available-slots"})
    @Operation(summary = "Get available booking time slots for a doctor on a specific date")
    public ResponseEntity<ApiResponse<List<LocalTime>>> getDoctorAvailability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<LocalTime> slots = doctorService.getDoctorAvailableSlots(id, date);
        return ResponseEntity.ok(ApiResponse.success(slots));
    }

    @GetMapping("/{id}/schedules")
    @Operation(summary = "Get weekly working schedules for a doctor")
    public ResponseEntity<ApiResponse<List<DoctorScheduleResponse>>> getDoctorSchedules(@PathVariable Long id) {
        List<DoctorScheduleResponse> schedules = doctorService.getDoctorSchedules(id);
        return ResponseEntity.ok(ApiResponse.success(schedules));
    }

    @PostMapping("/{id}/schedules")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    @Operation(summary = "Configure or update working hours schedule for a doctor (ADMIN, DOCTOR)")
    public ResponseEntity<ApiResponse<DoctorScheduleResponse>> addOrUpdateSchedule(
            @PathVariable Long id,
            @Valid @RequestBody DoctorScheduleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        DoctorScheduleResponse response = doctorService.addOrUpdateSchedule(id, request, principal != null ? principal.getUsername() : "ADMIN");
        return ResponseEntity.ok(ApiResponse.success("Doctor schedule updated successfully", response));
    }

    @PatchMapping("/{id}/availability")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    @Operation(summary = "Set doctor active availability status")
    public ResponseEntity<ApiResponse<DoctorResponse>> setDoctorAvailability(
            @PathVariable Long id,
            @RequestParam boolean available,
            @AuthenticationPrincipal UserPrincipal principal) {
        DoctorResponse response = doctorService.setDoctorAvailability(id, available, principal != null ? principal.getUsername() : "ADMIN");
        return ResponseEntity.ok(ApiResponse.success("Doctor availability status updated", response));
    }

    @GetMapping("/{id}/appointments")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST')")
    @Operation(summary = "Get appointment schedule for a doctor")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getDoctorAppointments(@PathVariable Long id) {
        List<AppointmentResponse> response = appointmentService.getDoctorAppointments(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
