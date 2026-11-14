"use client";
// Case created from the "Create case" dialog. Reads the problem from sessionStorage and starts investigating.
import { useEffect, useState } from "react";
import CaseView from "@/components/CaseView";
import { LIVE_KEY, PROBLEM_KEY } from "@/components/CreateCase";
import { copy } from "@/content/copy";

export default function NewCasePage() {
  const [init, setInit] = useState<{ problem: string; live: boolean; key: string } | null>(null);

  useEffect(() => {
    let problem: string = copy.create.examples[0].text;
    let live = true;
    try {
      problem = sessionStorage.getItem(PROBLEM_KEY) || problem;
      live = sessionStorage.getItem(LIVE_KEY) !== "0";
    } catch {
      /* use defaults */
    }
    setInit({ problem, live, key: `EP-${100 + (Date.now() % 900)}` });
  }, []);

  if (!init) return null;
  return (
    <CaseView
      caseKey={init.key}
      title={init.problem.length > 90 ? init.problem.slice(0, 87) + "…" : init.problem}
      problem={init.problem}
      initialStoreId={null}
      initialCase={null}
      autoRun
      initialLive={init.live}
    />
  );
}
