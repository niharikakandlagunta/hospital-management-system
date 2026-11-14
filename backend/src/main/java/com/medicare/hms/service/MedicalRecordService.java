package com.medicare.hms.service;

import com.medicare.hms.dto.request.MedicalRecordRequest;
import com.medicare.hms.dto.response.MedicalRecordResponse;
import com.medicare.hms.dto.response.PagedResponse;
import com.medicare.hms.security.UserPrincipal;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface MedicalRecordService {
    MedicalRecordResponse createMedicalRecord(MedicalRecordRequest request, UserPrincipal currentUser);
    MedicalRecordResponse updateMedicalRecord(Long id, MedicalRecordRequest request, UserPrincipal currentUser);
    MedicalRecordResponse getMedicalRecordById(Long id, UserPrincipal currentUser);
    PagedResponse<MedicalRecordResponse> getMedicalRecords(Long patientId, Long doctorId, LocalDate visitDate,
                                                          String search, Pageable pageable, UserPrincipal currentUser);
    List<MedicalRecordResponse> getPatientMedicalRecords(Long patientId, UserPrincipal currentUser);
}
