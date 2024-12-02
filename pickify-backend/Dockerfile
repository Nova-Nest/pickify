FROM openjdk:17-jdk-slim

ARG JAR_FILE=build/libs/*.jar

COPY ${JAR_FILE} pickify-backend.jar

# default profile 설정
# docker run 시 환경변수가 있을 경우 이가 우선시됨
# docker run -e SPRING_PROFILES_ACTIVE=prod -p 8080:8080 your-application:1.0 -> prod 으로 실행
ENV SPRING_PROFILES_ACTIVE=dev

ENTRYPOINT ["java","-jar","/pickify-backend.jar", "--spring.profiles.active=${SPRING_PROFILES_ACTIVE}"]