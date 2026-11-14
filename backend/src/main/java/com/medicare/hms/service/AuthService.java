package com.medicare.hms.service;

import com.medicare.hms.dto.request.LoginRequest;
import com.medicare.hms.dto.response.AuthResponse;
import com.medicare.hms.dto.response.UserSummaryResponse;
import com.medicare.hms.security.UserPrincipal;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse register(com.medicare.hms.dto.request.RegisterUserRequest request);
    UserSummaryResponse getCurrentUser(UserPrincipal principal);
}
