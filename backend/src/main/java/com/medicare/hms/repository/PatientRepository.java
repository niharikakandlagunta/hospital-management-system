package com.medicare.hms.repository;

import com.medicare.hms.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByRegistrationNumber(String registrationNumber);

    boolean existsByRegistrationNumber(String registrationNumber);

    Optional<Patient> findByPhone(String phone);

    long countByActiveTrue();

    @Query("SELECT p FROM Patient p WHERE " +
           "(:search IS NULL OR LOWER(p.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.registrationNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR p.phone LIKE CONCAT('%', :search, '%')) " +
           "AND (:active IS NULL OR p.active = :active)")
    Page<Patient> findWithFilters(@Param("search") String search,
                                  @Param("active") Boolean active,
                                  Pageable pageable);
}
