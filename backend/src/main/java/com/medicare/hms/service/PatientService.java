package com.medicare.hms.service;

import com.medicare.hms.dto.request.PatientRequest;
import com.medicare.hms.dto.response.PagedResponse;
import com.medicare.hms.dto.response.PatientResponse;
import org.springframework.data.domain.Pageable;

public interface PatientService {
    PatientResponse createPatient(PatientRequest request, String performedBy);
    PatientResponse updatePatient(Long id, PatientRequest request, String performedBy);
    PatientResponse getPatientById(Long id);
    PatientResponse getPatientByRegistrationNumber(String registrationNumber);
    PagedResponse<PatientResponse> getPatients(String search, Boolean active, Pageable pageable);
    PatientResponse setPatientStatus(Long id, boolean active, String performedBy);
}
