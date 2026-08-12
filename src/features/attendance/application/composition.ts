import { 
    ZustandSemesterRepository, 
    ZustandSubjectRepository,
    ZustandTimetableVersionRepository,
    ZustandAcademicCalendarRepository,
    ZustandScheduleOverrideRepository,
    ZustandAttendanceRepository
} from '../repositories/zustand-repositories';
import { AttendanceService, AttendanceCommandService } from '../services';

// 1. Instantiate Repositories
export const semesterRepo = new ZustandSemesterRepository();
export const subjectRepo = new ZustandSubjectRepository();
export const timetableVersionRepo = new ZustandTimetableVersionRepository();
const calendarRepo = new ZustandAcademicCalendarRepository();
const overrideRepo = new ZustandScheduleOverrideRepository();
const attendanceRepo = new ZustandAttendanceRepository();

// 2. Instantiate Services
export const attendanceService = new AttendanceService(
    semesterRepo,
    timetableVersionRepo,
    calendarRepo,
    overrideRepo,
    attendanceRepo
);

export const attendanceCommandService = new AttendanceCommandService(
    attendanceRepo
);
