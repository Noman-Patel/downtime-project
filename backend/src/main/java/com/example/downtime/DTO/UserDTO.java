package com.example.downtime.DTO;

import com.example.downtime.Entities.Role;

import java.time.LocalDateTime;

public record UserDTO(
        Long id,
        String username,
        String displayName,
        Role role,
        boolean enabled,
        LocalDateTime createdAt
) {
}
