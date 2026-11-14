package com.medicare.hms.repository;

import com.medicare.hms.entity.Appointment;
import com.medicare.hms.entity.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    Optional<Appointment> findByAppointmentReference(String appointmentReference);

    boolean existsByAppointmentReference(String appointmentReference);

    List<Appointment> findByDoctorIdAndAppointmentDate(Long doctorId, LocalDate appointmentDate);

    List<Appointment> findByPatientIdOrderByAppointmentDateDescStartTimeDesc(Long patientId);

    List<Appointment> findByDoctorIdOrderByAppointmentDateDescStartTimeDesc(Long doctorId);

    long countByAppointmentDate(LocalDate appointmentDate);

    long countByStatus(AppointmentStatus status);

    long countByAppointmentDateAndStatus(LocalDate appointmentDate, AppointmentStatus status);

    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId " +
           "AND a.appointmentDate = :date " +
           "AND a.status NOT IN :excludedStatuses " +
           "AND (:excludeAppointmentId IS NULL OR a.id != :excludeAppointmentId) " +
           "AND (a.startTime < :endTime AND a.endTime > :startTime)")
    List<Appointment> findConflictingAppointments(@Param("doctorId") Long doctorId,
                                                  @Param("date") LocalDate date,
                                                  @Param("startTime") LocalTime startTime,
                                                  @Param("endTime") LocalTime endTime,
                                                  @Param("excludedStatuses") Collection<AppointmentStatus> excludedStatuses,
                                                  @Param("excludeAppointmentId") Long excludeAppointmentId);

    @Query("SELECT a FROM Appointment a WHERE " +
           "(:doctorId IS NULL OR a.doctor.id = :doctorId) AND " +
           "(:patientId IS NULL OR a.patient.id = :patientId) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:startDate IS NULL OR a.appointmentDate >= :startDate) AND " +
           "(:endDate IS NULL OR a.appointmentDate <= :endDate) AND " +
           "(:search IS NULL OR LOWER(a.appointmentReference) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.patient.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.doctor.fullName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Appointment> findWithFilters(@Param("doctorId") Long doctorId,
                                      @Param("patientId") Long patientId,
                                      @Param("status") AppointmentStatus status,
                                      @Param("startDate") LocalDate startDate,
                                      @Param("endDate") LocalDate endDate,
                                      @Param("search") String search,
                                      Pageable pageable);

    @Query("SELECT a FROM Appointment a WHERE a.appointmentDate = :date ORDER BY a.startTime ASC")
    List<Appointment> findTodayAppointments(@Param("date") LocalDate date);

    @Query("SELECT a FROM Appointment a WHERE a.appointmentDate >= :startDate AND a.appointmentDate <= :endDate ORDER BY a.appointmentDate ASC, a.startTime ASC")
    List<Appointment> findBetweenDates(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
