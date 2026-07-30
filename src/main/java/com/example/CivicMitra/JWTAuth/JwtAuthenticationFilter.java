package com.example.CivicMitra.JWTAuth;


import com.example.CivicMitra.Service.CustomUserDetailsService;
import com.example.CivicMitra.Service.WorkerUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT authentication filter — runs once per request.
 *
 * Routing logic:
 *   - If JWT subject starts with "W-"  → worker token → WorkerUserDetailsService
 *   - Otherwise                        → citizen token → CustomUserDetailsService
 *
 * Both paths produce a UsernamePasswordAuthenticationToken placed into the
 * SecurityContext, so downstream controllers and @PreAuthorize annotations
 * work identically regardless of whether the caller is a citizen or a worker.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService customUserDetailsService;
    private final WorkerUserDetailsService workerUserDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService,
                                   CustomUserDetailsService customUserDetailsService,
                                   WorkerUserDetailsService workerUserDetailsService) {
        this.jwtService = jwtService;
        this.customUserDetailsService = customUserDetailsService;
        this.workerUserDetailsService = workerUserDetailsService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Extract Authorization header
        final String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Extract raw token
        final String jwt = authHeader.substring(7);

        // 3. Extract subject (email for citizens, workerCode for workers)
        final String subject = jwtService.extractUsername(jwt);

        // 4. Only proceed if we have a subject and no existing auth in this session
        if (subject != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // 5. Route to the correct UserDetailsService based on subject prefix
            final UserDetails userDetails;
            if (subject.startsWith("W-")) {
                // Worker token — load via WorkerUserDetailsService
                userDetails = workerUserDetailsService.loadUserByUsername(subject);
            } else {
                // Citizen/Authority token — load via CustomUserDetailsService (email lookup)
                userDetails = customUserDetailsService.loadUserByUsername(subject);
            }

            // 6. Validate token signature + expiry against the loaded principal
            if (jwtService.isTokenValid(jwt, userDetails)) {

                // 7. Build Spring Security authentication token
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 8. Place into SecurityContext — request is now authenticated
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 9. Continue filter chain to the controller
        filterChain.doFilter(request, response);
    }
}
