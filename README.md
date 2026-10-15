# Lostlink_ey_edunet

**LOSTLINK** is a modern Full-Stack Lost & Found web platform built with Spring Boot, JPA, MySQL, Spring Security (JWT authentication), and a dynamic responsive frontend with in-app real-time messaging, chatbot assistance, and community feedback.

## Features

- **Item Reporting & Tracking**: Report lost and found items with categories, locations, and photo attachments.
- **In-App Real-Time Messaging**: WhatsApp-style secure chat between item owners and finders with click-to-chat redirection and instant notifications.
- **JWT Authentication & Role Security**: Secure user registration, login, and token-based API authentication.
- **AI / Rule-Based Chatbot Guide**: 24/7 smart assistant for community guidance on retrieving items and platform navigation.
- **Feedback & Rating System**: Community ratings and feedback module.
- **RESTful Architecture**: Clean REST APIs for items, users, messages, feedback, and chatbot interactions.

## Tech Stack

- **Backend**: Java 17+, Spring Boot 3.2.4 (Spring Data JPA, Spring Security, Spring Web)
- **Database**: MySQL
- **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS utility classes, FontAwesome
- **Build Tool**: Apache Maven Wrapper (`./mvnw`)

## Running Locally

1. Configure MySQL credentials in `src/main/resources/application.properties`.
2. Start the application:
   ```bash
   ./mvnw spring-boot:run
   ```
3. Open `http://localhost:8080` in your browser.
