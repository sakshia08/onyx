import { useNavigate, useParams } from "react-router";
import { monthKeyOfDate, monthName } from "@/domain/dates";
import { monthRecap } from "@/domain/recap";
import { canOfferLeftover } from "@/domain/rollover";
import { finishRecap } from "@/store/actions";
import { useAppStore } from "@/store";
import { RecapStories } from "./RecapStories";

/** Month end (PRD §8.8): the recap of the month that just closed, then leftover, then setup. */
export function RecapFlow() {
  const navigate = useNavigate();
  const data = useAppStore((s) => s.data);
  const month = data.activeMonthKey === null ? undefined : data.months[data.activeMonthKey];
  if (!month) return null;
  const next = monthName(monthKeyOfDate(new Date()));

  return (
    <RecapStories
      recap={monthRecap(month, data.months, data.piggies)}
      finishLabel={`Plan ${next} →`}
      onFinish={() => {
        if (
          canOfferLeftover(month, data.piggies) &&
          data.piggies.some((p) => p.status === "active")
        ) {
          void navigate("/recap/leftover");
        } else {
          // The stage moves to setup, and the gate takes us there
          finishRecap(month.key);
        }
      }}
    />
  );
}

/** A past month's recap, reopened later (PRD §8.8). */
export function RecapReview() {
  const { key } = useParams();
  const navigate = useNavigate();
  const data = useAppStore((s) => s.data);
  const month = key === undefined ? undefined : data.months[key];
  const back = () => {
    void navigate(-1);
  };
  if (!month || month.status !== "closed") {
    return <p className="p-8 text-body text-text-2">There's no recap for this month.</p>;
  }
  return (
    <RecapStories
      recap={monthRecap(month, data.months, data.piggies)}
      finishLabel="Done"
      onFinish={back}
      onClose={back}
    />
  );
}
