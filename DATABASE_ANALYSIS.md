# Student Mentoring Platform - Database & Real-time Analysis

## 1. Database Tables & Structure

### profiles
```
Columns: id, full_name, role, grade_level, subjects[], avatar_url, bio, goal_hours, avg_rating
```
- **Used by:** StudentDashboard, TutorDashboard, LeadershipDashboard, LogHours
- **Query pattern:** `.select("*").eq("id", userId)` + role-based filtering

### requests
```
Columns: id, student_id, tutor_id, subject, status (pending|accepted|scheduled|declined|completed), 
         meeting_date, created_at, accepted_at, accepted_by
```
- **Used by:** StudentRequests, UpcomingSessions, TutorOverview, FindTutor, LeadershipDashboard
- **Query patterns:**
  - Filter by status: `pending`, `accepted`, `scheduled`
  - Joins with profiles on student_id and tutor_id
  - Filters by tutor_id and student_id

### hours_logs
```
Columns: id, student_id, tutor_id, hours, session_date, subject, notes, 
         approved (bool), approved_by, approved_at, created_at
```
- **Used by:** ProgressTracking, MyLearning, TutorOverview, LeadershipDashboard, LogHours
- **Query patterns:**
  - Aggregate by `.select("hours")` to sum total
  - Filter by student_id for student progress
  - Filter by tutor_id for tutor metrics
  - Filter by approved status in LeadershipDashboard

---

## 2. Components Fetching Data

| Component | Table | Query Purpose | Real-time? |
|-----------|-------|---------------|-----------|
| **StudentDashboard** | profiles | Load user profile & verify role | No |
| **ProgressTracking** | hours_logs | Aggregate hours_learned & session count | ❌ Needs real-time |
| **MyLearning** | hours_logs | Fetch learning statistics | ❌ Needs real-time |
| **TutorOverview** | requests, hours_logs | Next meeting, active mentees count, volunteered hours | ❌ Needs real-time |
| **StudentRequests** | requests + profiles join | List pending requests for this tutor | ❌ Needs real-time |
| **LogHours** | requests | List of students to log hours for | No (static list) |
| **UpcomingSessions** | requests | Fetch scheduled sessions ordered by date | ❌ Needs real-time |
| **FindTutor** | profiles, requests | List all tutors + student's pending requests | ⚠️ Has real-time (inefficient) |
| **LeadershipDashboard** | hours_logs, requests | Pending approvals & requests | ❌ Needs real-time |

---

## 3. Current Real-time Listeners (Existing)

### ✅ TutorDashboard.tsx (GOOD IMPLEMENTATION)
```javascript
const channel = supabase
  .channel("sidebar-count-changes")
  .on(
    "postgres_changes",
    { 
      event: "*", 
      schema: "public", 
      table: "requests",
      filter: `tutor_id=eq.${session.user.id}` // FILTERED TO USER
    },
    () => fetchCount(session.user.id) // Refetch pending count
  )
  .subscribe();
```
**Status:** ✅ Correctly filters by tutor_id and updates pending request badge

### ⚠️ FindTutor.tsx (INEFFICIENT IMPLEMENTATION)
```javascript
const channel = supabase
  .channel("find-tutor-realtime")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "requests" },
    () => fetchData() // Refetches EVERYTHING on ANY request change
  )
  .subscribe();
```
**Issues:**
- Listens to ALL requests in the system (not filtered)
- Causes unnecessary refetches when other students' requests change
- Should filter to: `student_id=eq.${session.user.id}`

---

## 4. Tables That Need Real-time Syncing

### Priority: HIGH ⚠️
**hours_logs** - Multiple student-facing metrics depend on this:
- ProgressTracking (progress bar, total hours)
- MyLearning (session count, total hours)
- TutorOverview (volunteered hours metric)

**When to trigger:** After leadership approves hours OR tutor logs hours

### Priority: HIGH ⚠️
**requests** - Status changes need immediate feedback:
- StudentRequests (when status changes from pending → accepted/declined)
- UpcomingSessions (when meeting_date is set)
- FindTutor (when request status changes to accepted/scheduled)
- TutorOverview (next meeting updates)

**When to trigger:** Status updates, meeting_date changes, new requests

### Priority: MEDIUM 📌
**profiles** - User profile updates:
- Currently no real-time listeners
- Could benefit if users update their bio/avatar/subjects while browsing

---

## 5. Messaging & Email Infrastructure

### ❌ NONE FOUND
No existing infrastructure for:
- Email notifications
- In-app messaging
- SMS notifications
- Push notifications
- Notification tables/system

### What Should Be Added:
1. **notifications table** - To track sent notifications
2. **messages table** - For in-app messaging between students & tutors
3. **Email service integration** - Sendgrid, AWS SES, or similar
4. **Notification triggers** - When:
   - New student request arrives
   - Tutor accepts/declines request
   - Hours logged
   - Leadership approves/denies hours
   - Meeting date scheduled

---

## 6. Database Query Summary by Feature

### Student Flow
1. **Signup** → Create record in profiles (role: 'student')
2. **Browse Tutors** → Query profiles WHERE role='tutor' + check student's requests
3. **Send Request** → Insert into requests (status: 'pending')
4. **Accept Meeting** → Update requests.meeting_date, status='scheduled'
5. **Track Progress** → SUM(hours_logs.hours) WHERE student_id = current_user

### Tutor Flow
1. **Signup** → Create record in profiles (role: 'tutor')
2. **Dashboard** → Listen to requests table (status changes)
3. **View Requests** → Query requests WHERE tutor_id = current_user AND status='pending'
4. **Log Hours** → Insert into hours_logs after session
5. **View Metrics** → Aggregate hours_logs for this tutor

### Leadership Flow
1. **View Pending** → Query hours_logs WHERE approved=false
2. **Review Requests** → Query requests WHERE status='pending' with student/tutor joins
3. **Approve** → Update hours_logs.approved=true + approved_by + approved_at
4. **Grant Access** → Update profiles.role='leadership' for selected users

---

## 7. Recommendations

### Immediate (Real-time Issues)
- [ ] Fix FindTutor listener to filter by student_id
- [ ] Add real-time listeners to hours_logs for ProgressTracking/MyLearning
- [ ] Add real-time listeners to requests for TutorOverview, UpcomingSessions

### Short-term (Infrastructure)
- [ ] Create notifications/messaging tables
- [ ] Implement email service integration
- [ ] Add notification triggers on key events

### Medium-term (Performance)
- [ ] Add database indexes on frequently filtered columns (tutor_id, student_id, status)
- [ ] Implement RLS (Row Level Security) policies
- [ ] Consider caching popular queries (tutors list)

### Long-term (Scale)
- [ ] Add activity feed table for audit trail
- [ ] Implement soft deletes for data retention
- [ ] Add analytics/reporting tables
