-- =============================================
-- LMS (수강관리시스템) Supabase Schema
-- =============================================

-- 프로필 테이블 (auth.users 확장)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin')) DEFAULT 'student',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 강의 테이블
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT DEFAULT '일반',
  max_students INT DEFAULT 100,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 강의 콘텐츠 (강의 영상/자료)
CREATE TABLE course_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'document', 'link')),
  content_url TEXT,
  description TEXT,
  sort_order INT DEFAULT 0,
  duration_minutes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 수강 신청 테이블
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped')),
  progress NUMERIC(5,2) DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, course_id)
);

-- 콘텐츠 진행 상태
CREATE TABLE content_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES course_contents(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, content_id)
);

-- 과제 테이블
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  max_score INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 과제 제출 테이블
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  score INT,
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ,
  UNIQUE(assignment_id, student_id)
);

-- 공지사항 테이블
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 질의응답 테이블
CREATE TABLE qna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_answered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 질의응답 답변
CREATE TABLE qna_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qna_id UUID NOT NULL REFERENCES qna(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시스템 로그 (관리자 모니터링용)
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE qna ENABLE ROW LEVEL SECURITY;
ALTER TABLE qna_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- profiles 정책
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- courses 정책
CREATE POLICY "Published courses are viewable by everyone" ON courses FOR SELECT USING (true);
CREATE POLICY "Instructors can insert courses" ON courses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'instructor')
);
CREATE POLICY "Instructors can update own courses" ON courses FOR UPDATE USING (instructor_id = auth.uid());
CREATE POLICY "Instructors can delete own courses" ON courses FOR DELETE USING (instructor_id = auth.uid());

-- course_contents 정책
CREATE POLICY "Contents viewable by enrolled students and instructors" ON course_contents FOR SELECT USING (true);
CREATE POLICY "Instructors can manage contents" ON course_contents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);
CREATE POLICY "Instructors can update contents" ON course_contents FOR UPDATE USING (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);
CREATE POLICY "Instructors can delete contents" ON course_contents FOR DELETE USING (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);

-- enrollments 정책
CREATE POLICY "Users can view own enrollments" ON enrollments FOR SELECT USING (
  student_id = auth.uid() OR
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Students can enroll" ON enrollments FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can update own enrollment" ON enrollments FOR UPDATE USING (student_id = auth.uid());

-- content_progress 정책
CREATE POLICY "Users can view own progress" ON content_progress FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Users can insert own progress" ON content_progress FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Users can update own progress" ON content_progress FOR UPDATE USING (student_id = auth.uid());

-- assignments 정책
CREATE POLICY "Assignments viewable by enrolled" ON assignments FOR SELECT USING (true);
CREATE POLICY "Instructors can manage assignments" ON assignments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);
CREATE POLICY "Instructors can update assignments" ON assignments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);
CREATE POLICY "Instructors can delete assignments" ON assignments FOR DELETE USING (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);

-- submissions 정책
CREATE POLICY "Submissions viewable by student and instructor" ON submissions FOR SELECT USING (
  student_id = auth.uid() OR
  EXISTS (SELECT 1 FROM assignments a JOIN courses c ON c.id = a.course_id WHERE a.id = assignment_id AND c.instructor_id = auth.uid())
);
CREATE POLICY "Students can submit" ON submissions FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Instructors can grade" ON submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM assignments a JOIN courses c ON c.id = a.course_id WHERE a.id = assignment_id AND c.instructor_id = auth.uid())
);

-- announcements 정책
CREATE POLICY "Announcements viewable by all" ON announcements FOR SELECT USING (true);
CREATE POLICY "Instructors can create announcements" ON announcements FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors can update announcements" ON announcements FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Authors can delete announcements" ON announcements FOR DELETE USING (author_id = auth.uid());

-- qna 정책
CREATE POLICY "QnA viewable by all" ON qna FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post questions" ON qna FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors can update questions" ON qna FOR UPDATE USING (author_id = auth.uid());

-- qna_replies 정책
CREATE POLICY "Replies viewable by all" ON qna_replies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can reply" ON qna_replies FOR INSERT WITH CHECK (author_id = auth.uid());

-- system_logs 정책 (관리자만)
CREATE POLICY "Admins can view logs" ON system_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can insert logs" ON system_logs FOR INSERT WITH CHECK (true);

-- 프로필 자동 생성 트리거
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 인덱스
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_contents_course ON course_contents(course_id);
CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_announcements_course ON announcements(course_id);
CREATE INDEX idx_qna_course ON qna(course_id);
CREATE INDEX idx_system_logs_created ON system_logs(created_at DESC);
