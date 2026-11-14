package com.medicare.hms.repository;

import com.medicare.hms.entity.MedicalRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    List<MedicalRecord> findByPatientIdOrderByVisitDateDesc(Long patientId);

    List<MedicalRecord> findByDoctorIdOrderByVisitDateDesc(Long doctorId);

    @Query("SELECT m FROM MedicalRecord m WHERE " +
           "(:patientId IS NULL OR m.patient.id = :patientId) AND " +
           "(:doctorId IS NULL OR m.doctor.id = :doctorId) AND " +
           "(:visitDate IS NULL OR m.visitDate = :visitDate) AND " +
           "(:search IS NULL OR LOWER(m.diagnosis) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(m.chiefComplaint) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(m.patient.fullName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<MedicalRecord> findWithFilters(@Param("patientId") Long patientId,
                                        @Param("doctorId") Long doctorId,
                                        @Param("visitDate") LocalDate visitDate,
                                        @Param("search") String search,
                                        Pageable pageable);
}
