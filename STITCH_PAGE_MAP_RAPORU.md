# Stitch Sayfa Eşleştirme Raporu

Bu rapor, uygulamadaki route/sayfa yapısının Stitch ekranları ile nasıl eşlendiğini gösterir.

## Eşleşme Tablosu

| Route | Stitch Başlığı | Stitch ID | Stitch Görseli | Uygulama Dosyaları | Durum |
|---|---|---|---|---|---|
| /coach/templates/[id]/assign | Coach: Assign Program | 5d50ef57ee3346ae9796b575cf4fc30c | .stitch/screens/5d50ef57ee3346ae9796b575cf4fc30c/screen.html | app/(coach)/coach/templates/[id]/assign/page.tsx, components/coach/TemplateAssignBoard.tsx | Uygulandı |
| /coach/clients/[clientId]/progress | Coach: Analytics Lab | f810ccacb43f4f2ba6a827153e17215b | .stitch/screens/f810ccacb43f4f2ba6a827153e17215b/screen.html | app/(coach)/coach/clients/[clientId]/progress/page.tsx, components/coach/ProgressCharts.tsx | Uygulandı |
| /client/workouts | Client: Workout History | 50179215b46544c5a6256ea0bf67b9d5 | .stitch/screens/50179215b46544c5a6256ea0bf67b9d5/screen.html | app/(client)/client/workouts/page.tsx | Uygulandı |
| /client/workouts/[workoutId] | Past Session Detail | 00ca496cfcdc40279fced62bf766a7d9 | .stitch/screens/00ca496cfcdc40279fced62bf766a7d9/screen.html | app/(client)/client/workouts/[workoutId]/page.tsx | Uygulandı |
| /client/workouts/[workoutId] | Workout Summary | 5b6ef42c8291483ebc8ce2ca266a6d52 | .stitch/screens/5b6ef42c8291483ebc8ce2ca266a6d52/screen.html | app/(client)/client/workouts/[workoutId]/page.tsx | Uygulandı |
| /coach/clients | Coach: Client Roster | 8b93e56a738a4465a966495184958b3e | .stitch/screens/8b93e56a738a4465a966495184958b3e/screen.html | app/(coach)/coach/clients/page.tsx, components/coach/CoachClientsManager.tsx | Uygulandı |
| /coach/dashboard | Coach Command Center | 221d459d9b5948f6bdd7db64ac59aeb7 | .stitch/screens/221d459d9b5948f6bdd7db64ac59aeb7/screen.html | app/(coach)/coach/dashboard/page.tsx | Uygulandı |
| /coach/dashboard | Coach Dashboard (Rebranded) | 65d71d09dc8a431ea20a2e6a7adef0eb | .stitch/screens/65d71d09dc8a431ea20a2e6a7adef0eb/screen.html | app/(coach)/coach/dashboard/page.tsx | Uygulandı |
| /client/dashboard | Athlete Mission Control | cc4bba3c29ff45c2b0218d1ae6484cf4 | .stitch/screens/cc4bba3c29ff45c2b0218d1ae6484cf4/screen.html | app/(client)/client/dashboard/page.tsx | Uygulandı |
| /client/dashboard | Client Dashboard (Rebranded) | 8eef758338154f75934eba503cca845c | .stitch/screens/8eef758338154f75934eba503cca845c/screen.html | app/(client)/client/dashboard/page.tsx | Uygulandı |
| /messages | Messages & Chat (Rebranded) | aba498f75ce0403cbc63f742299171a5 | .stitch/screens/aba498f75ce0403cbc63f742299171a5/screen.html | app/(shared)/messages/page.tsx, components/shared/MessagesClient.tsx | Uygulandı |
| /client/workout/[assignmentId]/start | Live Workout Session | 6c66944087ab453c8c5677b423d46964 | .stitch/screens/6c66944087ab453c8c5677b423d46964/screen.html | app/(client)/client/workout/[assignmentId]/start/page.tsx, components/client/StartConfirmationPage.tsx, components/client/ClientWorkoutFlow.tsx | Uygulandı |
| /client/workout/[assignmentId]/start | Workout Session (Rebranded) | f4c03f1e11b04df1a69c572411046631 | .stitch/screens/f4c03f1e11b04df1a69c572411046631/screen.html | app/(client)/client/workout/[assignmentId]/start/page.tsx, components/client/StartConfirmationPage.tsx, components/client/ClientWorkoutFlow.tsx | Uygulandı |
| /coach/exercises ve template builder akışı | Workout Builder (Rebranded) | 86ed0f0ce79a47969ee38a53c9822fd6 | .stitch/screens/86ed0f0ce79a47969ee38a53c9822fd6/screen.html | app/(coach)/coach/exercises/page.tsx, app/(coach)/coach/templates/new/page.tsx, app/(coach)/coach/templates/[id]/edit/page.tsx | Kısmi |
| /client/performance | Client: Performance Trends | e9632e9ed58d4d8ebd8dce8c05108b61 | .stitch/screens/e9632e9ed58d4d8ebd8dce8c05108b61/screen.html | route henüz yok | Bekliyor |

## Notlar

- Bazı route'lar birden fazla Stitch ekranından referans alındı (ör. dashboard ve workout detail).
- Eşleşme mantığı birebir HTML kopyası değil, mevcut ürün davranışı korunarak görsel ve bilgi mimarisi uyarlaması şeklinde yapıldı.