package com.medicare.hms.service.impl;

import com.medicare.hms.dto.request.LoginRequest;
import com.medicare.hms.dto.response.AuthResponse;
import com.medicare.hms.dto.response.UserSummaryResponse;
import com.medicare.hms.entity.User;
import com.medicare.hms.exception.BadRequestException;
import com.medicare.hms.exception.ResourceNotFoundException;
import com.medicare.hms.mapper.EntityDtoMapper;
import com.medicare.hms.repository.UserRepository;
import com.medicare.hms.security.JwtTokenProvider;
import com.medicare.hms.security.UserPrincipal;
import com.medicare.hms.service.AuditLogService;
import com.medicare.hms.service.AuthService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final EntityDtoMapper mapper;
    private final AuditLogService auditLogService;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           JwtTokenProvider tokenProvider,
                           UserRepository userRepository,
                           EntityDtoMapper mapper,
                           AuditLogService auditLogService,
                           PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.mapper = mapper;
        this.auditLogService = auditLogService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public AuthResponse register(com.medicare.hms.dto.request.RegisterUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new com.medicare.hms.exception.ConflictException("Username '" + request.getUsername() + "' is already registered");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new com.medicare.hms.exception.ConflictException("Email '" + request.getEmail() + "' is already registered");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setRole(request.getRole() != null ? request.getRole() : com.medicare.hms.entity.Role.RECEPTIONIST);
        user.setActive(true);

        User savedUser = userRepository.save(user);
        auditLogService.logAction("USER_REGISTERED", "User", savedUser.getId(), savedUser.getUsername(),
                "New account registered with role " + savedUser.getRole());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        return new AuthResponse(
                jwt,
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getFullName(),
                savedUser.getRole()
        );
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        auditLogService.logAction("USER_LOGIN", "User", principal.getId(), principal.getUsername(), "Successful login");

        return new AuthResponse(
                jwt,
                principal.getId(),
                principal.getUsername(),
                principal.getEmail(),
                principal.getFullName(),
                principal.getRole()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryResponse getCurrentUser(UserPrincipal principal) {
        if (principal == null) {
            throw new BadRequestException("No authenticated user found in context");
        }
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + principal.getId()));

        return mapper.toUserSummary(user);
    }
}
