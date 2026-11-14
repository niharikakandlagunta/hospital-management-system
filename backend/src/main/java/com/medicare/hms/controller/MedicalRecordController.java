package com.medicare.hms.controller;

import com.medicare.hms.dto.request.MedicalRecordRequest;
import com.medicare.hms.dto.response.ApiResponse;
import com.medicare.hms.dto.response.MedicalRecordResponse;
import com.medicare.hms.dto.response.PagedResponse;
import com.medicare.hms.security.UserPrincipal;
import com.medicare.hms.service.MedicalRecordService;
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
@RequestMapping("/api/v1")
@PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
@Tag(name = "Medical Records", description = "Clinical records and prescriptions module with strict doctor/admin-only access control")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    public MedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    @PostMapping("/medical-records")
    @Operation(summary = "Create clinical encounter record with prescriptions (DOCTOR, ADMIN)")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> createMedicalRecord(
            @Valid @RequestBody MedicalRecordRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        MedicalRecordResponse response = medicalRecordService.createMedicalRecord(request, principal);
        return new ResponseEntity<>(ApiResponse.success("Medical record created successfully", response), HttpStatus.CREATED);
    }

    @GetMapping("/medical-records")
    @Operation(summary = "List medical records with search and pagination (DOCTOR, ADMIN)")
    public ResponseEntity<ApiResponse<PagedResponse<MedicalRecordResponse>>> getMedicalRecords(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate visitDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        PagedResponse<MedicalRecordResponse> response = medicalRecordService.getMedicalRecords(
                patientId, doctorId, visitDate, search, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "visitDate")), principal
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/medical-records/{id}")
    @Operation(summary = "Get medical record details by ID (DOCTOR, ADMIN)")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> getMedicalRecordById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        MedicalRecordResponse response = medicalRecordService.getMedicalRecordById(id, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/medical-records/{id}")
    @Operation(summary = "Update clinical notes and prescriptions (DOCTOR author, ADMIN)")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> updateMedicalRecord(
            @PathVariable Long id,
            @Valid @RequestBody MedicalRecordRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        MedicalRecordResponse response = medicalRecordService.updateMedicalRecord(id, request, principal);
        return ResponseEntity.ok(ApiResponse.success("Medical record updated successfully", response));
    }

    @GetMapping("/patients/{id}/medical-records")
    @Operation(summary = "Get all medical records for a specific patient (DOCTOR, ADMIN)")
    public ResponseEntity<ApiResponse<List<MedicalRecordResponse>>> getPatientMedicalRecords(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<MedicalRecordResponse> response = medicalRecordService.getPatientMedicalRecords(id, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
