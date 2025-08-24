FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install protobuf compiler and plugins
RUN apk add --no-cache git protobuf protobuf-dev
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
RUN go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@latest
RUN go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2@latest

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Generate protobuf code
COPY proto/ proto/
RUN protoc --proto_path=proto \
    --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    --grpc-gateway_out=. --grpc-gateway_opt=paths=source_relative \
    --openapiv2_out=swagger \
    proto/neighborhood_mapping.proto

# Build application
COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o server ./cmd/server

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates
WORKDIR /root/

COPY --from=builder /app/server .
COPY --from=builder /app/swagger ./swagger

EXPOSE 50051 8081

CMD ["./server"]
