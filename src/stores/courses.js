import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export const useCourseStore = defineStore('courses', () => {
  const courses = ref([])
  const currentCourse = ref(null)
  const loading = ref(false)

  async function fetchCourses(search = '') {
    loading.value = true
    let query = supabase
      .from('courses')
      .select('*, instructor:profiles!instructor_id(full_name, email)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const { data } = await query
    courses.value = data || []
    loading.value = false
  }

  async function fetchAllCourses() {
    loading.value = true
    const { data } = await supabase
      .from('courses')
      .select('*, instructor:profiles!instructor_id(full_name, email)')
      .order('created_at', { ascending: false })
    courses.value = data || []
    loading.value = false
  }

  async function fetchCourse(id) {
    const { data } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:profiles!instructor_id(full_name, email, avatar_url),
        contents:course_contents(*, id, title, content_type, content_url, description, sort_order, duration_minutes),
        assignments(*),
        announcements(*, author:profiles!author_id(full_name)),
        qna(*, author:profiles!author_id(full_name))
      `)
      .eq('id', id)
      .single()
    currentCourse.value = data
    return data
  }

  async function fetchInstructorCourses(instructorId) {
    loading.value = true
    const { data } = await supabase
      .from('courses')
      .select('*, enrollments(count)')
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false })
    courses.value = data || []
    loading.value = false
  }

  async function createCourse(course) {
    const { data, error } = await supabase.from('courses').insert(course).select().single()
    if (error) throw error
    return data
  }

  async function updateCourse(id, updates) {
    const { data, error } = await supabase.from('courses').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  }

  async function deleteCourse(id) {
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) throw error
  }

  return {
    courses, currentCourse, loading,
    fetchCourses, fetchAllCourses, fetchCourse, fetchInstructorCourses,
    createCourse, updateCourse, deleteCourse
  }
})
