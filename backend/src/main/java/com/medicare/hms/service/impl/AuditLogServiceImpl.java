package com.medicare.hms.service.impl;

import com.medicare.hms.dto.response.AuditLogResponse;
import com.medicare.hms.dto.response.PagedResponse;
import com.medicare.hms.entity.AuditLog;
import com.medicare.hms.mapper.EntityDtoMapper;
import com.medicare.hms.repository.AuditLogRepository;
import com.medicare.hms.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogServiceImpl.class);

    private final AuditLogRepository auditLogRepository;
    private final EntityDtoMapper mapper;

    public AuditLogServiceImpl(AuditLogRepository auditLogRepository, EntityDtoMapper mapper) {
        this.auditLogRepository = auditLogRepository;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public void logAction(String action, String entityName, Long entityId, String performedBy, String details) {
        try {
            AuditLog auditLog = new AuditLog(null, action, entityName, entityId, performedBy, details, "127.0.0.1");
            auditLogRepository.save(auditLog);
            log.info("AUDIT: [{}] by {} on {}:{}", action, performedBy, entityName, entityId);
        } catch (Exception ex) {
            log.error("Failed to persist audit log: {}", ex.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<AuditLogResponse> getAllLogs(Pageable pageable) {
        Page<AuditLog> page = auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<AuditLogResponse> content = page.getContent().stream()
                .map(mapper::toAuditLogResponse)
                .collect(Collectors.toList());

        return new PagedResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }
}
