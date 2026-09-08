# Server Settings Redesign

## Goal

Tách việc chọn server khỏi việc chỉnh cấu hình server: header chỉ hiển thị một selector nhỏ gọn, trang Settings hiển thị danh sách server, và mỗi server tùy chỉnh có trang chi tiết để chỉnh endpoint, API key, model routes, capability và hướng dẫn MCP.

## Design

- Dữ liệu cấu hình sẽ hỗ trợ nhiều custom server với `id`, tên hiển thị, base URL, API key, model routes và model mặc định.
- Dữ liệu schema cũ (`customGatewayBaseUrl`, `apiKey`, `customModels`, `selectedModel`) được migrate thành một custom server duy nhất khi đọc lần đầu. Các field cũ vẫn được duy trì trong object runtime để không phá các use case hiện tại.
- Header server selector chỉ hiển thị trạng thái và tên/host rút gọn của server đang chọn. Popup chỉ làm nhiệm vụ chọn server và có một CTA `Thiết lập server`; không chứa form cấu hình hoặc MCP.
- `/settings/servers` là màn hình danh sách độc lập, không render conversation tabs.
- `/settings/servers/:serverId` là màn hình chi tiết. Server mặc định được xem là read-only; custom server có thể chỉnh, lưu, thêm model và xóa.
- MCP được đặt ở cuối màn hình chi tiết custom server dưới dạng một card thu gọn có ngữ cảnh “MCP cho server này”. Nó không xuất hiện trong selector, danh sách server hoặc màn hình chat.
- Khi lưu hoặc kích hoạt server, model list trong composer chỉ lấy từ server đang chọn. Khi đổi server, model hiện tại được fallback về model đầu tiên hợp lệ của server mới.
- Các route Settings chỉ thay đổi URL history và state của ứng dụng; nginx hiện tại đã fallback mọi path về `index.html`, nên refresh vẫn tải được app.

## Error handling

- URL/API key/model route được normalize như hiện tại.
- Server thiếu base URL được hiển thị trạng thái chưa cấu hình và không thể kích hoạt cho tới khi được lưu hợp lệ.
- Xóa custom server sẽ chuyển active server về server mặc định và về trang danh sách.
- Health check chỉ chạy cho server đang chọn khi ở chat; khi mở danh sách hoặc selector, các server hiện có được kiểm tra song song.

## Verification

- Unit tests cho migration, normalize server profiles và route parsing.
- Component tests bảo đảm selector không render URL đầy đủ, Settings không render conversation tabs, và chọn/chỉnh server cập nhật model scope.
- Chạy toàn bộ Vitest và production build, sau đó kiểm tra responsive bằng browser ở desktop và mobile.
