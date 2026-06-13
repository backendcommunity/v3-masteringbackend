"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import { useEffect, useState } from "react";
import { Bootcamp, Meta } from "@/lib/data";
import { useDebounce } from "@/hooks/use-debounce";
import { Loader } from "../ui/loader";

interface BootcampsPageProps {
  onNavigate?: (url: string) => void;
}

export function BootcampsPage({ onNavigate }: BootcampsPageProps) {
  const store = useAppStore();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [bootcamps, setBootcamps] = useState<Bootcamp[] | any>([]);
  const [meta, setMeta] = useState<Meta>();
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Calculate total enrolled from all cohorts
  const getTotalEnrolled = (bootcamp: any) => {
    if (!bootcamp?.cohorts) return bootcamp?.totalEnrolled || 0;
    return bootcamp.cohorts.reduce((total: number, cohort: any) => {
      return total + (cohort?.userCohorts?.length || 0);
    }, 0);
  };

  const load = async () => {
    setLoading(true);
    const data = await store.getBootcamps({
      size: 10,
      skip: 0,
    });

    setBootcamps(data?.bootcamps);
    setMeta(data?.meta);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function load() {
      if (
        selectedDuration.includes("all") &&
        !debouncedSearch &&
        selectedLevel.includes("all") &&
        selectedType.includes("all")
      )
        return;

      const data = await store.getBootcamps({
        size: 10,
        skip: 0,
        filters: {
          type: selectedType,
          terms: debouncedSearch,
          level: selectedLevel,
          duration: selectedDuration,
        },
      });

      setBootcamps(data?.bootcamps);
      setMeta(data?.meta);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedType, selectedDuration, selectedLevel]);

  if (loading) return <Loader isLoader={false} />;

  return (
    <div className="flex-1 space-y-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bootcamps</h1>
          <p className="text-muted-foreground">
            Intensive, cohort-based programs designed to accelerate your backend
            engineering skills
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Bootcamps
            </CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bootcamps.length}</div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Enrolled
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bootcamps.reduce(
                (sum: number, b: any) => sum + (b.totalEnrolled || 0),
                0,
              )}
            </div>
            <p className="text-xs text-muted-foreground">Students enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Spots
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bootcamps.reduce(
                (sum: number, b: any) => sum + (b?.cohort?.spotsLeft || 0),
                0,
              )}
            </div>
            <p className="text-xs text-muted-foreground">Spots remaining</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Cohorts
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                bootcamps.filter(
                  (b: any) => new Date(b?.cohort?.startsAt) > new Date(),
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Starting soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bootcamps..."
            className="pl-8"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Bootcamps" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bootcamps</SelectItem>
            <SelectItem value="my">My Bootcamp</SelectItem>
            <SelectItem value="soon">Starting Soon</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedDuration} onValueChange={setSelectedDuration}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Durations</SelectItem>
            <SelectItem value="short">4-8 weeks</SelectItem>
            <SelectItem value="medium">8-12 weeks</SelectItem>
            <SelectItem value="long">12+ weeks</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bootcamps Grid */}
      <div className={`grid gap-6 ${bootcamps.length ? "md:grid-cols-2" : ""}`}>
        {bootcamps.length <= 0 && (
          <Card className="">
            <CardHeader></CardHeader>

            <CardContent className="text-center">
              <div className="text-gray-400 py-3">
                The applied filter has returned no results
              </div>
              <Button
                onClick={() => {
                  setSelectedDuration("all");
                  setSelectedLevel("all");
                  setSelectedType("all");
                  setSearchQuery("");
                  load();
                }}
                variant={"secondary"}
              >
                Remove all filters
              </Button>
            </CardContent>
          </Card>
        )}
        {bootcamps.length > 0 &&
          bootcamps?.map((bootcamp: Bootcamp | any) => (
            <Card key={bootcamp.id} className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-r from-[#0E1F33] to-[#13AECE] flex items-center justify-center">
                {bootcamp.banner ? (
                  <img src={bootcamp.banner} alt="" />
                ) : (
                  <div className="text-center text-white">
                    <Zap className="h-12 w-12 mx-auto mb-2" />
                    <h3 className="text-lg font-bold">{bootcamp.title}</h3>
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        bootcamp?.level === "Advanced"
                          ? "destructive"
                          : bootcamp?.level === "Intermediate"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {bootcamp?.level}
                    </Badge>
                    <Badge variant={"destructive"}>
                      {bootcamp.cohort.name}
                    </Badge>
                  </div>
                  {/* <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{bootcamp.rating}</span>
                </div> */}
                </div>
                <CardTitle className="line-clamp-2">{bootcamp.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {bootcamp.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{bootcamp?.cohort?.duration} weeks</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Starts{" "}
                      {new Date(
                        bootcamp?.cohort?.startsAt,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{bootcamp?.totalGraduates} graduates</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>{bootcamp?.cohort?.spotsLeft} spots left</span>
                  </div>
                </div>

                {bootcamp.enrolled ? (
                  <div className="space-y-2">
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      Enrolled
                    </Badge>
                    <Button
                      className="w-full"
                      onClick={() =>
                        onNavigate?.(routes.bootcampDetail(bootcamp.id))
                      }
                    >
                      Access Bootcamp
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        ${bootcamp?.cohort?.amount?.toLocaleString()}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-orange-600 border-orange-200"
                      >
                        {bootcamp?.cohort?.spotsLeft} spots left
                      </Badge>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() =>
                        onNavigate?.(routes.bootcampDetail(bootcamp.id))
                      }
                    >
                      View Details
                    </Button>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Instructor: {bootcamp?.instructor ?? "Mastering Backend"}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Why Choose Our Bootcamps */}
      <Card className="bg-gradient-to-r from-[#0E1F33] to-[#13AECE] text-white">
        <CardHeader>
          <CardTitle>Why Choose MB Bootcamps?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Live Instruction</span>
              </div>
              <p className="text-sm text-blue-100">
                Learn from industry experts in real-time with interactive
                sessions
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="font-medium">Peer Learning</span>
              </div>
              <p className="text-sm text-blue-100">
                Collaborate with motivated peers and build lasting professional
                networks
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                <span className="font-medium">Career Support</span>
              </div>
              <p className="text-sm text-blue-100">
                Get personalized career coaching and job placement assistance
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
