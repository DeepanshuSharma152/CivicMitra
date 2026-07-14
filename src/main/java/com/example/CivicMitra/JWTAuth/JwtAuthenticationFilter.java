package com.example.CivicMitra.JWTAuth;


import com.example.CivicMitra.Service.CustomUserDetailsService;
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

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService customUserDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService,CustomUserDetailsService customUserDetailsService){
        this.jwtService=jwtService;
        this.customUserDetailsService=customUserDetailsService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
       // 1. Extract the Authorization Header
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // 2. Check if the header is missing or doesn't start with "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response); // Pass it down the chain (it will likely be rejected later)
            return;
        }

        // 3. Extract the token (Remove "Bearer " from the string)
        jwt = authHeader.substring(7);

        // 4. Extract the email from the token using our Token Factory
        userEmail = jwtService.extractUsername(jwt);

        // 5. If we have an email, and the user isn't already authenticated in this session
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Fetch the user from the database
            UserDetails userDetails = this.customUserDetailsService.loadUserByUsername(userEmail);

            // 6. Validate the token
            if (jwtService.isTokenValid(jwt, userDetails)) {

                // 7. Create the "Security Pass" for Spring
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );

                // Attach details like IP address to the token
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 8. Put the pass into the Security Context (The user is now officially logged in for this request)
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 9. Move to the next filter or to the Controller!
        filterChain.doFilter(request, response);
    }

    }


