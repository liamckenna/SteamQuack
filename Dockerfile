ARG GO_VERSION=1.22
FROM golang:${GO_VERSION}-bookworm as builder

WORKDIR /usr/src/app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN cd backend && go build -v -o /usr/src/app/run-app .

FROM debian:bookworm

RUN apt-get update && apt-get install -y ca-certificates

COPY --from=builder /usr/src/app/run-app /run-app
EXPOSE 8080
CMD ["/run-app"]