# Cosmos Art Studio Security Specification

## Data Invariants
- Products and Gallery items are read-only for public users.
- Orders can be created by anyone (anonymous flow), but once created, they cannot be modified or deleted by the public.
- Orders have mandatory fields: id, items, totalAmount, status, date.
- Status starts as 'Kutilmoqda'.

## The "Dirty Dozen" Payloads (Denial Examples)
1. **Unauthorized Product Write**: Attempting to update a product price as a non-admin.
2. **Order Hijacking**: Attempting to read another user's order without a specific identifier (though currently rules are open for create, read-back is limited).
3. **Ghost Field in Order**: Adding `isPaid: true` during order creation.
4. **Invalid Order ID**: Using a 2KB string as an order ID.
5. **Schema Bypass**: Creating an order without the `totalAmount` field.
6. **Price Tampering**: Submitting an order where `totalAmount` is negative.
7. **Status Manipulation**: Creating an order with status 'Tasdiqlandi' instead of 'Kutilmoqda'.
8. **Malicious Gallery Update**: Attempting to delete a gallery item.
9. **Identity Spoofing**: Setting a fake `userId` in the order (if auth was present).
10. **Resource Poisoning**: Injecting massive arrays into the `items` list.
11. **Type Mismatch**: Sending a string for `totalAmount`.
12. **System Field Overwrite**: Attempting to set `createdAt` manually (should be server-controlled).

## Rules Logic
- `match /products/{id}`: `allow read: if true;`, `allow write: if false;` (admin handled via SDK).
- `match /gallery/{id}`: `allow read: if true;`, `allow write: if false;`.
- `match /orders/{id}`: `allow create: if isValidOrder(request.resource.data);`, `allow read: if true;` (or restricted).
