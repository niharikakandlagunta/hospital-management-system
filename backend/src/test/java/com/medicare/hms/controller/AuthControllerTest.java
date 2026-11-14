package com.medicare.hms.controller;

import com.medicare.hms.dto.request.LoginRequest;
import com.medicare.hms.dto.response.ApiResponse;
import com.medicare.hms.dto.response.AuthResponse;
import com.medicare.hms.entity.Role;
import com.medicare.hms.service.AuditLogService;
import com.medicare.hms.service.AuthService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private AuthController authController;

    @Test
    void testLogin_Success() {
        LoginRequest request = new LoginRequest("admin", "Admin@123");
        AuthResponse authResponse = new AuthResponse("mock.jwt.token", 1L, "admin", "admin@medicare.com", "Administrator", Role.ADMIN);

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        ResponseEntity<ApiResponse<AuthResponse>> response = authController.login(request);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals("mock.jwt.token", response.getBody().getData().getToken());
        assertEquals(Role.ADMIN, response.getBody().getData().getRole());
    }

    @Test
    void testRegister_Success() {
        com.medicare.hms.dto.request.RegisterUserRequest request =
                new com.medicare.hms.dto.request.RegisterUserRequest("newdoctor", "Doctor@123", "newdoctor@medicare.com", "Dr. New Doctor", Role.DOCTOR);
        AuthResponse authResponse = new AuthResponse("mock.jwt.token", 10L, "newdoctor", "newdoctor@medicare.com", "Dr. New Doctor", Role.DOCTOR);

        when(authService.register(any(com.medicare.hms.dto.request.RegisterUserRequest.class))).thenReturn(authResponse);

        ResponseEntity<ApiResponse<AuthResponse>> response = authController.register(request);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Account created successfully", response.getBody().getMessage());
        assertEquals("mock.jwt.token", response.getBody().getData().getToken());
    }

    @Test
    void testLogin_InvalidCredentials() {
        LoginRequest request = new LoginRequest("admin", "WrongPassword");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Invalid username or password"));

        assertThrows(BadCredentialsException.class, () -> authController.login(request));
    }
}
