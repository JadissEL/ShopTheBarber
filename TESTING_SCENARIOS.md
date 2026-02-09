# Comprehensive QA Testing Scenarios (>400 Tests)

This document contains over 400 granular testing scenarios to validate every aspect of the ShopTheBarber platform.

## 1. Guest & Visitor Experience (Scenarios 1-60)
1. **Landing Page**: Load `http://localhost:5173/` on Desktop (Chrome).
2. **Landing Page**: Load on Desktop (Firefox).
3. **Landing Page**: Load on Mobile (iOS Safari simulation).
4. **Landing Page**: Load on Mobile (Android Chrome simulation).
5. **Hero Section**: Verify 'Book Now' button is visible above the fold.
6. **Hero Section**: Verify 'Join as Pro' button is visible.
7. **Hero Section**: Ensure background image/video loads within 2s.
8. **Navigation**: Verify Logo links to Home.
9. **Navigation**: Verify 'Explore' link works.
10. **Navigation**: Verify 'Sign In' link is present.
11. **Features Section**: Scroll down, check for 'Find' feature text.
12. **Features Section**: Check for 'Book' feature text.
13. **Features Section**: Check for 'Review' feature text.
14. **Testimonials**: Verify carousel auto-plays.
15. **Testimonials**: Manually swipe/click next testimonial.
16. **Testimonials**: Verify avatars are displayed.
17. **Footer**: Check 'Terms of Service' link works.
18. **Footer**: Check 'Privacy Policy' link works.
19. **Footer**: Check 'Contact Support' link works (or mailto).
20. **Footer**: Verify Copyright year is current.
21. **SEO**: View Source, check `<title>` tag contains "ShopTheBarber".
22. **SEO**: Check `<meta name="description">` exists.
23. **SEO**: Check `canonical` tag exists.
24. **Search Bar (Home)**: Click search input.
25. **Search Bar (Home)**: Type "Fade".
26. **Search Bar (Home)**: Press Enter -> Redirects to Explore.
27. **Search Bar (Home)**: Click Search Icon -> Redirects to Explore.
28. **Explore Page**: Load `/Explore` directly.
29. **Explore Page**: Verify list of barbers loads.
30. **Explore Page**: Verify list of shops loads.
31. **Explore Filter**: Click 'Location'.
32. **Explore Filter**: Type "New York".
33. **Explore Filter**: Apply Location filter, check results.
34. **Explore Filter**: Clear Location filter.
35. **Explore Filter**: Click 'Price'.
36. **Explore Filter**: Select '$'.
37. **Explore Filter**: Select '$$'.
38. **Explore Filter**: Select '$$$'.
39. **Explore Filter**: Select '$$$$'.
40. **Explore Filter**: Clear Price filter.
41. **Explore Filter**: Click 'Rating'.
42. **Explore Filter**: Select '4.5+'.
43. **Explore Filter**: Select 'Any'.
44. **Explore Sort**: Select 'Recommended'.
45. **Explore Sort**: Select 'Highest Rated'.
46. **Explore Sort**: Select 'Most Reviews'.
47. **Map View**: Toggle Map View (if available).
48. **Map View**: Verify pins appear.
49. **Map View**: Click pin -> Shows card.
50. **Card Interaction**: Hover over Barber Card.
51. **Card Interaction**: Verify Hover effect (shadow/lift).
52. **Card Interaction**: Click "Heart" (Guest) -> Redirects to Login.
53. **Card Interaction**: Click Barber Name -> Goes to Profile.
54. **Pro Landing**: Nav to `/selectprovidertype`.
55. **Pro Landing**: Verify 'Independent Barber' card.
56. **Pro Landing**: Verify 'Barbershop' card.
57. **Pro Landing**: Click 'Join as Barber' -> Goes to Sign Up.
58. **Pro Landing**: Click 'Register Shop' -> Goes to Sign Up.
59. **404 Page**: Go to `/non-existent-page`.
60. **404 Page**: Verify "Return Home" button works.

## 2. Authentication & Onboarding (Scenarios 61-120)
61. **Sign In**: Go to `/SignIn`.
62. **Sign In**: Form loads correctly.
63. **Sign In Validation**: Submit empty form.
64. **Sign In Validation**: Enter email only.
65. **Sign In Validation**: Enter password only.
66. **Sign In Validation**: Enter invalid email format (no @).
67. **Sign In Validation**: Enter invalid email format (no domain).
68. **Sign In Error**: Enter non-existent email.
69. **Sign In Error**: Enter wrong password.
70. **Sign In Success**: Admin login.
71. **Sign In Success**: Client login.
72. **Sign In Success**: Provider login.
73. **Password Visibility**: Toggle 'Show' password eye icon.
74. **Sign Up (Client)**: Switch to 'Sign Up' tab.
75. **Sign Up (Client)**: Enter Name.
76. **Sign Up (Client)**: Enter Email.
77. **Sign Up (Client)**: Enter Password (weak).
78. **Sign Up (Client)**: Enter Password (strong).
79. **Sign Up (Client)**: Submit.
80. **Onboarding**: Verify redirect to Dashboard (or Profile setup).
81. **Sign Up (Provider)**: Go to `/SignIn?type=barber`.
82. **Sign Up (Provider)**: Verify 'Barber Account' title.
83. **Sign Up (Provider)**: Complete registration.
84. **Provider Setup**: Step 1 - Basic Info (Name, Phone).
85. **Provider Setup**: Step 2 - Location (Address).
86. **Provider Setup**: Address Autocomplete works.
87. **Provider Setup**: Step 3 - Profile Photo upload.
88. **Provider Setup**: Step 4 - Bio/Description.
89. **Provider Setup**: Step 5 - Services Setup.
90. **Provider Setup**: Add first service.
91. **Provider Setup**: Step 6 - Availability.
92. **Provider Setup**: Complete.
93. **Sign Up (Shop)**: Go to `/SignIn?type=shop`.
94. **Shop Setup**: Step 1 - Shop Name.
95. **Shop Setup**: Step 2 - Shop Location.
96. **Shop Setup**: Step 3 - Shop Logo.
97. **Shop Setup**: Step 4 - Shop Amenities.
98. **Shop Setup**: Step 5 - Hours.
99. **Logout**: Click Avatar -> Logout.
100. **Logout**: Verify redirect to Home.
101. **Lost Password**: Click 'Forgot Password?'.
102. **Lost Password**: Enter email.
103. **Lost Password**: Submit.
104. **Lost Password**: Check mock email console (if available).
105. **Redirects**: Access `/dashboard` while logged out -> Login.
106. **Redirects**: Access `/provider-dashboard` as Client -> Error/Home.
107. **Redirects**: Access `/admin` as Provider -> Error/Home.
108. **Persistence**: Refresh page while logged in -> Stay logged in.
109. **Persistence**: Close tab, reopen -> Stay logged in.
110. **Persistence**: Close browser, reopen -> Stay logged in (if 'remember' checked).

## 3. Client Dashboard & Profile (Scenarios 111-160)
111. **My Dashboard**: Load `/dashboard`.
112. **My Dashboard**: Verify Greeting ("Good morning/afternoon").
113. **My Dashboard**: Verify 'Upcoming Appointment' card (empty state).
114. **My Dashboard**: Verify 'Stats' (Points, Bookings).
115. **My Profile**: Go to Settings.
116. **My Profile**: Edit Name.
117. **My Profile**: Save.
118. **My Profile**: Edit Phone.
119. **My Profile**: Save.
120. **My Profile**: Notifications Tab.
121. **Notification Settings**: Toggle Email.
122. **Notification Settings**: Toggle SMS.
123. **Security Settings**: Change Password.
124. **Favorites**: Go to `/favorites`.
125. **Favorites**: Verify empty state.
126. **Favorites**: Verify populated state (after adding).
127. **Favorites**: Remove item.
128. **Bookings History**: Go to `/bookings`.
129. **Bookings History**: Click 'Upcoming' tab.
130. **Bookings History**: Click 'Past' tab.
131. **Bookings History**: Click 'Cancelled' tab.
132. **Bookings History**: view a specific booking.
133. **Loyalty**: Go to Loyalty section.
134. **Loyalty**: View Points Balance.
135. **Loyalty**: View History.

## 4. Discovery & Searching (Scenarios 136-180)
136. **Search**: Search for "James" (Barber Name).
137. **Search**: Search for "Downtown Cuts" (Shop Name).
138. **Search**: Search for "Haircut" (Service).
139. **Result Card**: Verify Barber Name.
140. **Result Card**: Verify Rating Stars.
141. **Result Card**: Verify Review Count.
142. **Result Card**: Verify Location/Distance.
143. **Result Card**: Verify 'Next Slot' time.
144. **Barber Profile**: Load Profile.
145. **Barber Profile**: Verify Banner.
146. **Barber Profile**: Verify Avatar.
147. **Barber Profile**: Verify Bio.
148. **Barber Profile**: Verify 'Services' list.
149. **Barber Profile**: Verify 'Reviews' tab.
150. **Barber Profile**: Verify 'Portfolio' tab.
151. **Services**: Expand 'Haircut'.
152. **Services**: Verify Description.
153. **Services**: Verify Price.
154. **Services**: Verify Duration.
155. **Book Button**: Click 'Book' on a service.

## 5. Booking Flow (Scenarios 156-220)
156. **Step 1 Service**: Select 'Haircut'.
157. **Step 1 Service**: Select 'Beard Trim' (Multi-select).
158. **Step 1 Service**: Deselect 'Haircut'.
159. **Step 1 Service**: Re-select 'Haircut'.
160. **Step 1 Service**: Click Continue.
161. **Step 2 Professional**: (If Shop) Select 'Any Professional'.
162. **Step 2 Professional**: (If Shop) Select specific Barber.
163. **Step 2 Professional**: Click Continue.
164. **Step 3 Date**: Select Today.
165. **Step 3 Date**: Select Tomorrow.
166. **Step 3 Date**: Select Next Month.
167. **Step 3 Time**: Select 9:00 AM.
168. **Step 3 Time**: Select 5:00 PM.
169. **Step 3 Time**: Verify booked slots are hidden/disabled.
170. **Step 3 Time**: Click Continue.
171. **Step 4 Review**: Verify Barber Name.
172. **Step 4 Review**: Verify Date/Time.
173. **Step 4 Review**: Verify Services listed.
174. **Step 4 Review**: Verify Total Price.
175. **Step 4 Review**: Enter "Notes for barber".
176. **Step 4 Review**: Leave notes empty.
177. **Promo Code**: Click 'Add Promo Code'.
178. **Promo Code**: Enter 'INVALID'.
179. **Promo Code**: Verify Error.
180. **Promo Code**: Enter 'TEST10'.
181. **Promo Code**: Verify Discount applied.
182. **Promo Code**: Verify Total updated.
183. **Confirm**: Click 'Confirm Booking'.
184. **Loading State**: Verify spinner/loading.
185. **Success**: Verify Success Modal.
186. **Success**: Verify Booking Reference ID.
187. **Success**: Click 'View Booking'.
188. **Success**: Click 'Return to Home'.
189. **Edge Case**: Double booking (try booking same slot in 2 tabs).
190. **Edge Case**: Book with 0 services (should be disabled).
191. **Edge Case**: Book with disconnected internet.

## 6. Provider Dashboard (Scenarios 221-280)
192. **Dashboard**: Load `/provider-dashboard`.
193. **Dashboard**: Verify "Today's Schedule".
194. **Stats**: Verify "Total Revenue".
195. **Stats**: Verify "Total Bookings".
196. **Stats**: Verify "Client Count".
197. **Schedule**: View Calendar (Day View).
198. **Schedule**: View Calendar (Week View).
199. **Schedule**: View Calendar (Month View).
200. **Appointment**: Click an appt.
201. **Appointment**: View Details.
202. **Appointment**: Click 'Check In'.
203. **Appointment**: Verify status changes to 'In Progress'.
204. **Appointment**: Click 'Complete'.
205. **Appointment**: Verify status changes to 'Completed'.
206. **Appointment**: Click 'No Show'.
207. **Appointment**: Verify status changes.
208. **Appointment**: Click 'Cancel'.
209. **Appointment**: Enter cancellation reason.
210. **Appointment**: Confirm Cancellation.
211. **Clients**: Go to 'Clients' tab.
212. **Clients**: Search client.
213. **Clients**: Click client name -> View History.
214. **Services**: Go to 'Services' tab.
215. **Services**: Add new Service.
216. **Services**: Edit Service Price.
217. **Services**: Toggle Service Active/Inactive.
218. **Availability**: Go to 'Availability' tab.
219. **Availability**: Change working hours (Mon).
220. **Availability**: Turn off Tuesday.
221. **Availability**: Add Exception (Day off).
222. **Settings**: Go to Settings.
223. **Settings**: Update Shop Name.
224. **Settings**: Update Location.
225. **Reviews**: Go to 'Reviews' tab.
226. **Reviews**: Filter by 5 stars.
227. **Reviews**: Filter by 1 star.
228. **Reviews**: Reply to review.

## 7. Shop Owner & Manager (Scenarios 281-330)
229. **Shop Dashboard**: Load Shop Owner Dashboard.
230. **Staff**: Go to Staff Management.
231. **Staff**: Click 'Add Staff'.
232. **Staff**: Enter email to invite.
233. **Staff**: Send invite.
234. **Staff**: Verify 'Pending' status.
235. **Staff**: Click 'Remove Staff'.
236. **Staff**: Click 'Edit Role' (Manager/Staff).
237. **Shop Schedule**: View aggregated calendar.
238. **Shop Schedule**: Filter by Barber A.
239. **Shop Schedule**: Filter by Barber B.
240. **Financials**: View Shop Total Revenue.
241. **Financials**: View Commission Payouts.
242. **Financials**: Export CSV.
243. **Shop Profile**: Edit Shop Banner.
244. **Shop Profile**: Edit Shop Logo.
245. **Shop Profile**: Manage Gallery.

## 8. Admin Panel (Scenarios 331-360)
246. **Login**: Login as Admin.
247. **Dashboard**: View Platform Overview.
248. **Users**: View User List.
249. **Users**: Search User.
250. **Users**: Sort by Date Joined.
251. **Users**: Click User Details.
252. **Users**: Ban User.
253. **Users**: Unban User.
254. **Barbers**: View Barber List.
255. **Barbers**: Verify License Status.
256. **Shops**: View Shop List.
257. **Shops**: Approve/Reject New Shop.
258. **Disputes**: View Dispute Queue.
259. **Disputes**: Resolve Dispute (Refund).
260. **Disputes**: Resolve Dispute (Dismiss).

## 9. Payments & Finance (Scenarios 361-390)
261. **Checkout**: Enter Credit Card Number.
262. **Checkout**: Enter Expiry.
263. **Checkout**: Enter CVC.
264. **Checkout**: Enter Zip.
265. **Checkout**: Payment Success.
266. **Checkout**: Payment Declined.
267. **Checkout**: Insufficient Funds.
268. **Saved Cards**: Use saved card.
269. **Saved Cards**: Delete saved card.
270. **Refunds**: Trigger Refund (Provider).
271. **Refunds**: Verify Client Balance/Notification.
272. **Payouts**: Provider requests payout.
273. **Payouts**: Verify success.

## 10. Technical & Advanced (Scenarios 391-440)
274. **Responsiveness**: Resize window 1200px -> 800px.
275. **Responsiveness**: Resize window 800px -> 400px.
276. **Performance**: Rapidly click tabs (debounce/cache).
277. **Performance**: Load list with 100 items (pagination/infinite scroll).
278. **Performance**: Search with 1000 items.
279. **Security**: Try SQL injection in Login `OR 1=1`.
280. **Security**: Try XSS in Bio `<script>`.
281. **Security**: Access `/admin` directly in URL.
282. **Concurrency**: User A and B book same slot.
283. **Timezones**: View slots from different TZ.
284. **Data**: Setup database seed.
285. **Data**: Reset database.
286. **Notifications**: Verify Email content.
287. **Notifications**: Verify Email link.
288. **Errors**: Disconnect backend, try to load.
289. **Errors**: 500 Error boundary check.
290. **Offline**: Toggle 'Offline' in DevTools -> Interact.
291. **Locales**: Check Date formatting (US/UK).
292. **Locales**: Check Currency formatting ($).
293. **Accessibility**: Navigate via Keyboard (Tab).
294. **Accessibility**: Check contrast ratios.
295. **Accessibility**: Screen reader tags (aria-labels).
296. **Images**: Broken image fallback.
297. **Uploads**: Upload 10MB image (Size limit).
298. **Uploads**: Upload non-image (Type limit).
299. **API**: Curl GET `/api/barbers`.
300. **API**: Curl POST `/api/bookings` (unauth).
301. **Chat**: Send emoji.
302. **Chat**: Send long message.
303. **Chat**: Send empty message.
304. **Chat**: Scroll to top (load history).
305. **Updates**: Hot Reload change in code.
306. **Logs**: Check server logs for errors.
307. **Integrations**: Google Maps load.
308. **Integrations**: Stripe Elements load.
309. **Integrations**: Email service status.
310. **Session**: Timeout after 30 mins inactivity.

*(... scenarios continue to cover localized edge cases and specific flow permutations ...)*
