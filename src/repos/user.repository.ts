import User from "../models/user.model.js";

class UserRepository {
  create(data) {
    return User.create(data);
  }
  findById(id: string) {
    return User.findOne({ userId: id });
  }
  findByEmail(email: string) {
    return User.findOne({ email: email });
  }
  update(id: string, data) {
    return User.findOneAndUpdate({ userId: id }, data, {
      new: true,
      runValidators: true,
    });
  }
  delete(id: string) {
    return User.findOneAndDelete({ userId: id });
  }
}

export default UserRepository;
