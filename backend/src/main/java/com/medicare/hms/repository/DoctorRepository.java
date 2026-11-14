package com.medicare.hms.repository;

import com.medicare.hms.entity.Doctor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByEmail(String email);

    Optional<Doctor> findByUserId(Long userId);

    List<Doctor> findByAvailableTrue();

    long countByAvailableTrue();

    @Query("SELECT d FROM Doctor d WHERE " +
           "(:search IS NULL OR LOWER(d.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(d.specialization) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:departmentId IS NULL OR d.department.id = :departmentId) " +
           "AND (:available IS NULL OR d.available = :available)")
    Page<Doctor> findWithFilters(@Param("search") String search,
                                 @Param("departmentId") Long departmentId,
                                 @Param("available") Boolean available,
                                 Pageable pageable);
}
