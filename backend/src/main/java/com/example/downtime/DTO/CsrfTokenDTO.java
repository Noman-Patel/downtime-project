package com.example.downtime.DTO;

public record CsrfTokenDTO(
        String token,
        String headerName,
        String parameterName
) {
}
