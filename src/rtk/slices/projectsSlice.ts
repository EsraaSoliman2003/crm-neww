import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Project } from "@/utils/dtos";
import instance from "@/lib/axios";

/* ===========================
   Initial State
=========================== */
interface ProjectsState {
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  data: Project[];
  projectLoading: boolean;
  currentProject: Project | null;
  error: string | null;
}

const initialState: ProjectsState = {
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  data: [],
  projectLoading: false,
  currentProject: null,
  error: null,
};

/* ===========================
   Fetch Projects
=========================== */
export const fetchProjects = createAsyncThunk("projects/fetchAll", async () => {
  const res = await instance.get(`/Project`);
  return res.data;
});

/* ===========================
   Fetch Project By Id
=========================== */
export const fetchProjectById = createAsyncThunk(
  "projects/fetchById",
  async (id: number) => {
    const res = await instance.get(`/Project/${id}`);
    return res.data;
  },
);

/* ===========================
   Create Project
=========================== */
export const createProject = createAsyncThunk(
  "projects/create",
  async (projectData: Omit<Project, "id" | "estimates">) => {
    const formData = new FormData();

    formData.append("Name", projectData.name);
    formData.append("Sector", projectData.sector);
    formData.append("Location", projectData.location);
    formData.append("InvestmentCost", projectData.investmentCost.toString());
    formData.append("ProjectType", projectData.projectType);
    formData.append("StartDate", projectData.startDate);
    formData.append("Description", projectData.description || "");

    const res = await instance.post(`/Project`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
);

/* ===========================
   Update Project
=========================== */
export const updateProject = createAsyncThunk(
  "projects/update",
  async (projectData: Omit<Project, "estimates">) => {
    const formData = new FormData();

    formData.append("Id", projectData.id.toString());
    formData.append("Name", projectData.name);
    formData.append("Sector", projectData.sector);
    formData.append("Location", projectData.location);
    formData.append("InvestmentCost", projectData.investmentCost.toString());
    formData.append("ProjectType", projectData.projectType);
    formData.append("StartDate", projectData.startDate);
    formData.append("Description", projectData.description || "");

    const res = await instance.put(`/Project/${projectData.id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
);

/* ===========================
   Add Estimates
=========================== */
type AssignEstimatesPayload = {
  projectId: number;
  estimateIds: number[];
};

export const addEstimates = createAsyncThunk(
  "projects/assignEstimates",
  async (payload: AssignEstimatesPayload) => {
    const res = await instance.post(`/Project/assign-estimates`, payload);
    return res.data;
  },
);

/* ===========================
   Delete Project
=========================== */
export const deleteProject = createAsyncThunk(
  "projects/delete",
  async (id: number) => {
    await instance.delete(`/Project/${id}`);
    return { id };
  },
);

/* ===========================
   Slice
=========================== */
const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    resetProjectsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* ===== Fetch ===== */
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchProjects.rejected, (state) => {
        state.loading = false;
      })

      /* ===== Fetch By Id ===== */
      .addCase(fetchProjectById.pending, (state) => {
        state.projectLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.projectLoading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state) => {
        state.projectLoading = false;
      })

      /* ===== Create ===== */
      .addCase(createProject.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.creating = false;
        state.data.unshift(action.payload); // newest first
      })
      .addCase(createProject.rejected, (state) => {
        state.creating = false;
      })

      /* ===== Update ===== */
      .addCase(updateProject.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.updating = false;

        const index = state.data.findIndex(
          (project) => project.id === action.payload.id,
        );

        if (index !== -1) {
          state.data[index] = action.payload;
        }

        state.currentProject = action.payload;
      })
      .addCase(updateProject.rejected, (state) => {
        state.updating = false;
      })

      /* ===== Add Estimates ===== */
      .addCase(addEstimates.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(addEstimates.fulfilled, (state) => {
        state.creating = false;
        // state.data.unshift(action.payload);
      })
      .addCase(addEstimates.rejected, (state) => {
        state.creating = false;
      })

      /* ===== Delete ===== */
      .addCase(deleteProject.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.deleting = false;
        state.data = state.data.filter(
          (project) => project.id !== action.payload.id,
        );
      })
      .addCase(deleteProject.rejected, (state) => {
        state.deleting = false;
      });
  },
});

export const { resetProjectsState } = projectsSlice.actions;
export default projectsSlice.reducer;
