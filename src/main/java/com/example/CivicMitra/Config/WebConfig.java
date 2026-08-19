package com.example.CivicMitra.Config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

@Configuration
public class WebConfig {

    @Value("${APP_BASE_URL:http://localhost:3000}")
    private String appBaseUrl;

    // Amplify frontend URL — set APP_FRONTEND_URL on Elastic Beanstalk to your Amplify domain
    @Value("${APP_FRONTEND_URL:https://test-segregation-scoring-engine.d1ome3djvskzm3.amplifyapp.com}")
    private String appFrontendUrl;

    /**
     * Primary CORS config — Spring Security picks this bean up automatically via
     * .cors(Customizer.withDefaults()) in SecurityConfig, ensuring pre-flight
     * OPTIONS requests are handled before any JWT filter runs.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Build the allowed-origins list after @Value fields have been injected
        config.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:5173",
                appBaseUrl,
                appFrontendUrl,
                // Hard-coded fallback so deploys work even if env var is missing
                "https://test-segregation-scoring-engine.d1ome3djvskzm3.amplifyapp.com"
        ));

        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        config.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
        ));

        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * Keep the resource handler for uploaded files.
     */
    @Bean
    public WebMvcConfigurer resourceConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                String uploadPath = "file:" + System.getProperty("user.dir") + "/uploads/";
                registry.addResourceHandler("/uploads/**")
                        .addResourceLocations(uploadPath);
            }
        };
    }
}
