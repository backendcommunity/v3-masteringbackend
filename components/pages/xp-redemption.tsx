"use client";

import { useMemo, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, Zap, ShoppingCart, Clock, CheckCircle } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useAppStore } from "@/lib/store";
import { Reward } from "@/lib/data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { Loader } from "../ui/loader";

interface XpRedemptionPageProps {
  onNavigate: (path: string) => void;
}

export function XpRedemptionPage({ onNavigate }: XpRedemptionPageProps) {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState("rewards");
  const [name, setName] = useState<string>("");
  const [redeemReward, setRedeemReward] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [loadingAch, setLoadingAch] = useState(false);
  const [reward, setReward] = useState<Reward>();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [recentRedemptions, setRecentRedemptions] = useState<any[]>([]);

  const user = useUser();
  const [userXP] = useState(user?.points ?? 0);

  async function loadRewards() {
    setLoadingRewards(true);
    const rewards = await store.getRewards();
    setRewards(rewards);
    setRecentRedemptions(rewards?.filter((reward: Reward) => reward?.enrolled));
    setLoadingRewards(false);
  }

  async function loadAchievements() {
    setLoadingAch(true);
    const achievements = await store.getUserAchievement();

    setAchievements(achievements);
    setLoadingAch(false);
  }

  useMemo(() => {
    loadRewards();
    loadAchievements();
  }, []);

  const handleRedeem = async (reward: Reward) => {
    try {
      setLoading(true);
      if (name !== reward?.title) return;
      if (userXP < reward?.mb) toast.warning("You have insufficient MB");
      const userReward = await store.redeemReward(reward.id);

      setRewards((prev: Reward[]) =>
        prev.map((r: Reward) =>
          r.id === reward.id
            ? {
                ...r,
                userReward,
                enrolled: true,
              }
            : r,
        ),
      );
      setRedeemReward(false);
      toast.success("You've redeemed this reward");
    } catch (error: any) {
      toast.error(error?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MB Store</h1>
          <p className="text-muted-foreground">
            Redeem your MB for amazing rewards
          </p>
        </div>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span className="text-2xl font-bold">
              {userXP.toLocaleString()}
            </span>
            <span className="text-muted-foreground">MB</span>
          </div>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="space-y-4">
          {loadingRewards ? (
            <Loader isLoader={false} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards
                ?.sort(
                  (a: Reward | any, b: Reward | any) =>
                    b?.enrolled - a?.enrolled,
                )
                ?.map((reward: Reward) => (
                  <Card
                    key={reward.id}
                    className={`relative ${
                      !reward?.active ? "opacity-50" : ""
                    }`}
                  >
                    {reward?.enrolled && (
                      <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500">
                        Active
                      </Badge>
                    )}
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <i
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(reward?.icon!) }}
                        ></i>
                        <CardTitle className="text-lg">
                          {reward.title}
                        </CardTitle>
                      </div>
                      <CardDescription>{reward.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{reward.category}</Badge>
                          <div className="flex items-center space-x-1">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold">{reward.mb}</span>
                          </div>
                        </div>
                        <Button
                          className="w-full"
                          disabled={
                            reward.enrolled ||
                            !reward.active ||
                            userXP < reward.mb
                          }
                          onClick={() => {
                            setRedeemReward(true);
                            setReward(reward);
                          }}
                        >
                          {!reward.active ? (
                            <>
                              <Clock className="mr-2 h-4 w-4" />
                              Coming Soon
                            </>
                          ) : userXP < reward.mb ? (
                            `Need ${reward.mb - userXP} more MB`
                          ) : (
                            <>
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Redeem
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4">
            {!achievements?.length && (
              <div className="text-center p-8">
                <p className="text-muted-foreground">
                  You do not have any achievement at this moment. The quickest
                  roadmap to an achievement is to complete a course.
                </p>
                <Button onClick={() => onNavigate("/courses")} className="mt-2">
                  Start one now
                </Button>
              </div>
            )}

            {loadingAch ? (
              <Loader isLoader={false} />
            ) : (
              <>
                {achievements?.map((item: any, index: number) => {
                  const achievement = item?.achievement ?? item;
                  const progress = item?.progress ?? 0;
                  const required = achievement?.condition?.required ?? 0;
                  const completed =
                    achievement?.completed ?? item?.completed ?? false;
                  const percent = required
                    ? Math.min(100, Math.round((progress / required) * 100))
                    : 0;
                  const title =
                    achievement?.name ??
                    achievement?.title ??
                    item?.name ??
                    item?.title;
                  const description =
                    achievement?.description ?? item?.description;

                  return (
                    <Card key={achievement?.id ?? item?.id ?? index}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold">{title}</h3>
                              {achievement?.unlocked && (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                            <p className="text-muted-foreground mb-3">
                              {description}
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Progress</span>
                                <span>
                                  {progress}/{required}
                                </span>
                              </div>
                              <Progress value={percent} className="h-2" />
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="flex items-center space-x-1 mb-2">
                              <Zap className="h-4 w-4 text-yellow-500" />
                              <span className="font-bold">
                                {item?.xpReward ?? achievement?.xpReward ?? 0}
                              </span>
                            </div>
                            {completed ? (
                              <Badge variant="default">Completed</Badge>
                            ) : (
                              <Badge variant="outline">In Progress</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Redemption History</CardTitle>
              <CardDescription>
                Your recent MB redemptions and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRedemptions?.map((redemption) => (
                  <div
                    key={redemption.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-semibold">{redemption.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Redeemed on{" "}
                        {new Date(redemption?.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 mb-1">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="font-bold">{redemption.mb}</span>
                      </div>
                      <Badge
                        variant={
                          redemption.active
                            ? "default"
                            : redemption.completed
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {redemption.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={redeemReward} onOpenChange={() => setRedeemReward(false)}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              Redeen your reward
            </DialogTitle>
            <DialogDescription className="text-sm">
              Type this name{" "}
              <span className="italic text-gray-300 bg-gray-700 p-1">
                {reward?.title}
              </span>{" "}
              in the box below to redeem this reward.
            </DialogDescription>
          </DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)}></Input>

          <Button
            onClick={() => handleRedeem(reward!)}
            variant="default"
            disabled={loading}
            className="w-full gap-2"
          >
            {loading ? (
              "Redeeming..."
            ) : (
              <>
                <Star className="h-4 w-4" />
                Redeem Reward
              </>
            )}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
