ARG GO_VERSION=1.22
FROM golang:${GO_VERSION}-bookworm as builder

WORKDIR /usr/src/app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN cd backend && go build -v -o /run-app .


FROM debian:bookworm
COPY --from=builder /usr/src/app/backend/run-app /run-app
EXPOSE 8080
CMD ["/run-app"]