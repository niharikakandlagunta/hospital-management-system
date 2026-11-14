package com.medicare.hms.service.impl;

import com.medicare.hms.dto.request.RegisterUserRequest;
import com.medicare.hms.dto.response.PagedResponse;
import com.medicare.hms.dto.response.UserSummaryResponse;
import com.medicare.hms.entity.User;
import com.medicare.hms.exception.ConflictException;
import com.medicare.hms.exception.ResourceNotFoundException;
import com.medicare.hms.mapper.EntityDtoMapper;
import com.medicare.hms.repository.UserRepository;
import com.medicare.hms.service.AuditLogService;
import com.medicare.hms.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityDtoMapper mapper;
    private final AuditLogService auditLogService;

    public UserServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           EntityDtoMapper mapper,
                           AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.mapper = mapper;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public UserSummaryResponse createUser(RegisterUserRequest request, String createdBy) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Username '" + request.getUsername() + "' is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email '" + request.getEmail() + "' is already registered");
        }

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setFullName(request.getFullName().trim());
        user.setRole(request.getRole());
        user.setActive(true);

        User savedUser = userRepository.save(user);

        auditLogService.logAction("USER_CREATED", "User", savedUser.getId(), createdBy,
                "Created user " + savedUser.getUsername() + " with role " + savedUser.getRole());

        return mapper.toUserSummary(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<UserSummaryResponse> getAllUsers(Pageable pageable) {
        Page<User> page = userRepository.findAll(pageable);
        List<UserSummaryResponse> list = page.getContent().stream()
                .map(mapper::toUserSummary)
                .collect(Collectors.toList());

        return new PagedResponse<>(
                list,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapper.toUserSummary(user);
    }

    @Override
    @Transactional
    public UserSummaryResponse toggleUserStatus(Long id, String performedBy) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setActive(!user.isActive());
        User updated = userRepository.save(user);

        auditLogService.logAction("USER_STATUS_TOGGLED", "User", updated.getId(), performedBy,
                "User active status changed to " + updated.isActive());

        return mapper.toUserSummary(updated);
    }
}
