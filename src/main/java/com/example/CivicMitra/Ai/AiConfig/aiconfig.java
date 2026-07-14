package com.example.CivicMitra.Ai.AiConfig;

import org.springframework.boot.web.client.RestClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;

@Configuration
public class aiconfig {

    @Bean
    public RestClientCustomizer restClientCustomizer() {
        return restClientBuilder -> {
            // Use HttpComponents for better header and retry handling
            restClientBuilder.requestFactory(new HttpComponentsClientHttpRequestFactory());
        };
    }
}
