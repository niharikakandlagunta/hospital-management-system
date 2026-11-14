package com.medicare.hms.repository;

import com.medicare.hms.entity.PrescribedMedicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescribedMedicineRepository extends JpaRepository<PrescribedMedicine, Long> {
    List<PrescribedMedicine> findByMedicalRecordId(Long medicalRecordId);
}
