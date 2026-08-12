import { useState } from "react";
import { useUserStore } from "../../store/userStore";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { UserAvatar } from "../../components/user/UserAvatar";
import { Toast } from "../../components/ui/Toast";

const AVATAR_COLORS = [
  "violet",
  "emerald",
  "rose",
  "amber",
  "blue",
  "cyan",
  "indigo",
];

export default function ProfilePage() {
  const { profile, updateProfile } = useUserStore();
  
  // Local state for all fields
  const [name, setName] = useState(profile?.name || "");
  const [subtitle, setSubtitle] = useState(profile?.subtitle || "");
  const [avatarColor, setAvatarColor] = useState(profile?.avatarColor || "violet");
  const [email, setEmail] = useState(profile?.email || "");
  const [university, setUniversity] = useState(profile?.university || "");
  const [degree, setDegree] = useState(profile?.degree || "");
  const [branch, setBranch] = useState(profile?.branch || "");
  const [semester, setSemester] = useState(profile?.semester || "");
  const [targetAttendance, setTargetAttendance] = useState(profile?.targetAttendance?.toString() || "75");
  const [bio, setBio] = useState(profile?.bio || "");
  
  const [showToast, setShowToast] = useState(false);

  if (!profile) return null;

  const handleSave = () => {
    updateProfile({ 
      name, 
      subtitle, 
      avatarColor,
      email,
      university,
      degree,
      branch,
      semester,
      targetAttendance: parseInt(targetAttendance, 10) || 75,
      bio
    });
    setShowToast(true);
  };

  return (
    <div className="max-w-3xl mx-auto w-full pb-20 space-y-6">
      <PageHeader 
        title="Profile" 
        description="Manage your local identity and academic details." 
      />

      <div className="flex flex-col gap-6">
        {/* Profile Header / Identity */}
        <Card className="p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden bg-gradient-to-br from-card to-muted/20">
          <div className="shrink-0 relative group">
            <UserAvatar 
              user={{ ...profile, name, avatarColor }} 
              size="xl" 
              className="h-24 w-24 sm:h-32 sm:w-32 shadow-sm ring-4 ring-background"
            />
          </div>
          
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Your Name"
                className="text-2xl font-bold bg-transparent border-transparent hover:border-border focus:bg-background px-2 py-1 h-auto -ml-2 w-full max-w-sm transition-colors placeholder:text-muted-foreground/50"
              />
              <Input 
                value={subtitle} 
                onChange={(e) => setSubtitle(e.target.value)} 
                placeholder="Status / Subtitle"
                className="text-sm text-muted-foreground bg-transparent border-transparent hover:border-border focus:bg-background px-2 py-1 h-8 -ml-2 w-full max-w-sm mt-1 transition-colors"
              />
            </div>
            
            <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground font-medium pt-1">
              {(university || degree) ? (
                <>
                  <span>{degree || "No Degree"}</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span>{university || "No University"}</span>
                </>
              ) : (
                <span>Complete your academic info below</span>
              )}
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Avatar Theme</label>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                {AVATAR_COLORS.map((color) => {
                  const colorMap: Record<string, string> = {
                    violet: "bg-violet-500", emerald: "bg-emerald-500",
                    rose: "bg-rose-500", amber: "bg-amber-500",
                    blue: "bg-blue-500", cyan: "bg-cyan-500",
                    indigo: "bg-indigo-500",
                  };
                  return (
                    <button
                      key={color}
                      onClick={() => setAvatarColor(color)}
                      className={`w-6 h-6 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        avatarColor === color 
                          ? "ring-2 ring-offset-2 ring-foreground scale-110" 
                          : "ring-1 ring-border/50 hover:scale-110"
                      } ${colorMap[color]}`}
                      aria-label={`Select ${color} theme`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
        
        {/* Academic Details */}
        <Card className="p-6">
          <h3 className="text-base font-bold text-foreground mb-4">Academic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">University / Institution</label>
              <Input 
                value={university} 
                onChange={(e) => setUniversity(e.target.value)} 
                placeholder="e.g. MIT"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Degree Program</label>
              <Input 
                value={degree} 
                onChange={(e) => setDegree(e.target.value)} 
                placeholder="e.g. B.Tech"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Branch / Major</label>
              <Input 
                value={branch} 
                onChange={(e) => setBranch(e.target.value)} 
                placeholder="e.g. Computer Science"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Current Semester</label>
              <Input 
                value={semester} 
                onChange={(e) => setSemester(e.target.value)} 
                placeholder="e.g. Semester 4"
              />
            </div>
          </div>
        </Card>

        {/* Preferences / Bio */}
        <Card className="p-6">
          <h3 className="text-base font-bold text-foreground mb-4">Preferences & Personal Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-xs font-semibold text-muted-foreground">Target Attendance (%)</label>
              <Input 
                type="number"
                min="0"
                max="100"
                value={targetAttendance} 
                onChange={(e) => setTargetAttendance(e.target.value)} 
                placeholder="75"
              />
            </div>
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
              <Input 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short bio about yourself..."
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none text-sm placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
          <div className="text-xs text-muted-foreground font-medium">
            Local device storage
          </div>
          <Button onClick={handleSave} className="px-6">
            Save Profile
          </Button>
        </div>
      </div>
      {showToast && (
        <Toast 
          message="Profile updated successfully!" 
          onClose={() => setShowToast(false)} 
        />
      )}
    </div>
  );
}
